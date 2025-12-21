import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.STRAVA_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return new NextResponse('Verification failed', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { aspect_type, object_id, object_type, owner_id } = body;

    const response = NextResponse.json({ status: 'success' });

    if (object_type === 'activity' && aspect_type === 'create') {
      processActivity(object_id, owner_id).catch(err => 
        console.error("Background Sync Error:", err)
      );
    }

    return response;
  } catch (err) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

async function processActivity(activityId: number, athleteId: number) {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('profiles')
    .select('strava_access_token')
    .eq('strava_athlete_id', athleteId)
    .single();

  if (!user?.strava_access_token) return;

  const res = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${user.strava_access_token}` }
  });
  const activity = await res.json();

  await supabase.from('activities').upsert({
    strava_id: activity.id,
    title: activity.name,
    type: activity.type,
    distance: activity.distance,
    start_date: activity.start_date,
    user_id: user.id 
  });
}