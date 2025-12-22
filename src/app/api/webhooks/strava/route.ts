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
        processActivity(object_id, owner_id);
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
    .select('id, strava_access_token, strava_refresh_token, strava_expires_at')
    .eq('strava_athlete_id', athleteId)
    .single();

  if (!user || !user.strava_refresh_token) return;

  let accessToken = user.strava_access_token;

  const now = Math.floor(Date.now() / 1000);
  if (user.strava_expires_at < now + 300) {
    console.log("🔄 Token expired. Refreshing...");
    
    const res = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: user.strava_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();
    accessToken = data.access_token;

    await supabase.from('profiles').update({
      strava_access_token: data.access_token,
      strava_refresh_token: data.refresh_token,
      strava_expires_at: data.expires_at,
    }).eq('id', user.id);
  }

  const activityRes = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const activity = await activityRes.json();

  await supabase.from('activities').upsert({
    strava_id: activity.id,
    title: activity.name,
    type: activity.type,
    distance: activity.distance,
    start_date: activity.start_date,
    user_id: user.id 
  });
}