import { createClient } from '@/utils/supabase/server';
import { getValidToken } from '@/utils/strava'; 
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

    if (object_type === 'activity' && aspect_type === 'create') {
      processActivity(object_id, owner_id);
    }

    return NextResponse.json({ status: 'success' });
  } catch (err) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

async function processActivity(activityId: number, athleteId: number) {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('strava_athlete_id', athleteId)
    .single();

  if (!user) return;

  try {
    const accessToken = await getValidToken(user.id);
    const activityRes = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const activity = await activityRes.json();

    await supabase.from('activities').upsert({
      strava_id: activity.id,
      name: activity.name,
      type: activity.type,
      distance: activity.distance,
      moving_time: activity.moving_time,
      start_date: activity.start_date,
      user_id: user.id 
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
  }
}