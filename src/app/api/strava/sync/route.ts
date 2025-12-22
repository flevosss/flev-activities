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

        //fetch all activities
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

       //insert activities
        const activitiesToInsert = allActivities.map((activity: any) => ({
            user_id: userId,
            strava_id: activity.id,
            name: activity.name,
            distance: activity.distance,
            moving_time: activity.moving_time,
            type: activity.type,
            start_date: activity.start_date,
        }));

        const { error: activityError } = await supabase
            .from('activities')
            .upsert(activitiesToInsert, { onConflict: 'strava_id' });

        if (activityError) throw activityError;

        //filter out activities with media
        const activitiesWithMedia = allActivities.filter(a => a.total_photo_count > 0);

        //upload media links 
        for (const activity of activitiesWithMedia) {
            try {
                const mediaData = await fetchActivityMedia(activity.id, accessToken);

                if (mediaData.length > 0) {
                    const mediaToInsert = mediaData.map((m: any) => ({
                        strava_unique_id: m.unique_id, 
                        activity_id: activity.id,
                        user_id: userId,
                        media_type: m.video_url ? 'video' : 'photo',
                        url: m.url,           
                        video_url: m.video_url 
                    }));

                    const { error: mediaError } = await supabase
                        .from('activity_media')
                        .upsert(mediaToInsert); 

                    if (mediaError) console.error(`Supabase Media Error: ${mediaError.message}`);
                }
            } catch (mediaErr) {
                console.error(`Failed to process media for activity ${activity.id}:`, mediaErr);
            }
        }

        return NextResponse.json({
            success: true,
            activities_synced: allActivities.length,
            media_activities_processed: activitiesWithMedia.length
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
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