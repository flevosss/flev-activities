import { createClient } from '@/utils/supabase/server';
import { getValidToken } from '@/utils/strava';
import { NextResponse } from 'next/server';

export async function POST() {
    const supabase = await createClient();
    const userId = "1f1f69ae-aff1-416b-8503-0f1358547e1e";

    try {
        const accessToken = await getValidToken(userId);
        let page = 1;
        let allActivities: any[] = [];
        let keepFetching = true;

        // 1. Fetch all activities from Strava (Summary level)
        while (keepFetching) {
            const res = await fetch(
                `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            const activities = await res.json();

            if (Array.isArray(activities) && activities.length > 0) {
                allActivities = [...allActivities, ...activities];
                page++;
                if (page > 10) keepFetching = false;
            } else {
                keepFetching = false;
            }
        }

        if (allActivities.length === 0) {
            return NextResponse.json({ message: "No new activities found" });
        }

        // 2. Prepare activities for insertion
        const activitiesToInsert = allActivities.map((activity: any) => ({
            user_id: userId,
            strava_id: activity.id,
            name: activity.name,
            distance: activity.distance,
            moving_time: activity.moving_time,
            type: activity.type,
            start_date: activity.start_date,
        }));

        // 3. Upsert Activities and GET BACK the internal IDs
        const { data: insertedActivities, error: activityError } = await supabase
            .from('activities')
            .upsert(activitiesToInsert, { onConflict: 'strava_id' })
            .select('id, strava_id');

        if (activityError) throw activityError;

        // 4. Sync Splits and Media
        // We use a loop here to avoid hitting Strava rate limits too hard with Promise.all
        if (insertedActivities) {
            for (const activity of insertedActivities) {
                // Sync Splits (Detailed data)
                await syncActivitySplits(activity.id, activity.strava_id.toString(), accessToken);

                // Find original activity to check for photos
                const rawActivity = allActivities.find(a => a.id === activity.strava_id);
                if (rawActivity && rawActivity.total_photo_count > 0) {
                    await processActivityMedia(activity.id, activity.strava_id, userId, accessToken);
                }
            }
        }

        return NextResponse.json({
            success: true,
            activities_synced: allActivities.length,
            splits_processed: insertedActivities?.length || 0
        });

    } catch (err: any) {
        console.error("Sync Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * Fetches detailed activity to get splits and saves them to Supabase
 */
export async function syncActivitySplits(supabaseId: string, stravaId: string, accessToken: string) {
    const supabase = await createClient();

    try {
        const res = await fetch(`https://www.strava.com/api/v3/activities/${stravaId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!res.ok) return false;

        const detailedActivity = await res.json();
        const splits = detailedActivity.splits_metric;
        
        // 1. Get the TOTAL calories and TOTAL distance from the top level
        const totalCalories = detailedActivity.calories || 0;
        const totalDistance = detailedActivity.distance || 1; // avoid divide by zero

        if (!splits || splits.length === 0) return true;

        const splitsToInsert = splits.map((s: any) => {
            // 2. Calculate calories for THIS split based on its distance
            // (Split Distance / Total Distance) * Total Calories
            const splitCalories = (s.distance / totalDistance) * totalCalories;

            return {
                activity_id: supabaseId,
                split_number: s.split,
                distance: s.distance,
                elapsed_time: s.elapsed_time,
                moving_time: s.moving_time,
                elevation_difference: s.elevation_difference,
                average_speed: s.average_speed,
                max_speed: s.max_speed ?? 0,
                calories: Math.round(splitCalories) // Now it won't be undefined!
            };
        });

        const { error } = await supabase
            .from('activity_splits')
            .upsert(splitsToInsert, {
                onConflict: 'activity_id, split_number'
            });

        if (error) console.error(`Splits Error:`, error.message);
        return !error;
    } catch (err) {
        console.error(`Failed to sync splits:`, err);
        return false;
    }
}

/**
 * Handles fetching and saving media
 */
async function processActivityMedia(supabaseId: string, stravaId: number, userId: string, accessToken: string) {
    const supabase = await createClient();

    try {
        const mediaData = await fetchActivityMedia(stravaId, accessToken);

        if (mediaData.length > 0) {
            const mediaToInsert = mediaData.map((m: any) => ({
                strava_unique_id: m.unique_id,
                activity_id: supabaseId, // Now correctly using the UUID
                user_id: userId,
                media_type: m.video_url ? 'video' : 'photo',
                url: m.url,
                video_url: m.video_url
            }));

            const { error: mediaError } = await supabase
                .from('activity_media')
                .upsert(mediaToInsert, { onConflict: 'strava_unique_id' });

            if (mediaError) console.error(`Media Error: ${mediaError.message}`);
        }
    } catch (err) {
        console.error(`Failed media sync for ${stravaId}:`, err);
    }
}

async function fetchActivityMedia(activityId: number, accessToken: string) {
    const res = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}/photos?size=2048`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
        unique_id: item.unique_id,
        url: item.urls["2048"],
        video_url: item.video_url || null
    }));
}