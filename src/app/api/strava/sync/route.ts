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

        const activitiesToInsert = allActivities.map((activity: any) => ({
            user_id: userId,
            strava_id: activity.id,
            name: activity.name,
            distance: activity.distance,
            moving_time: activity.moving_time,
            type: activity.type,
            start_date: activity.start_date,
        }));

        const { error } = await supabase
            .from('activities')
            .upsert(activitiesToInsert, { onConflict: 'strava_id' });

        if (error) throw error;

        //now fetch photos
        const activitiesWithPhotos = allActivities.filter(a => a.total_photo_count > 0);

        for (const activity of activitiesWithPhotos) {
            try {
                const photoData = await fetchActivityPhotos(activity.id, accessToken);

                if (photoData.length > 0) {
                    const photosToInsert = photoData.map((p: any) => ({
                        strava_photo_id: p.id.toString(),
                        activity_id: activity.id,
                        url: p.url,
                        user_id: userId
                    }));

                    await supabase
                        .from('activity_photos')
                        .upsert(photosToInsert, { onConflict: 'strava_photo_id' });
                }

            } catch (photoErr) {
                console.error(`Failed to fetch photos for activity ${activity.id}:`, photoErr);
            }
        }

        return NextResponse.json({
            success: true,
            activities_synced: allActivities.length,
            photos_checked_for: activitiesWithPhotos.length
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function fetchActivityPhotos(activityId: number, accessToken: string) {
    const res = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}/photos?size=2048`,
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );

    const photos = await res.json();
    return photos.map((p: any) => ({
        id: p.id,
        activity_id: activityId,
        url: p.urls["2048"]
    }));
}