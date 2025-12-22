import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const supabase = await createClient();

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  const data = await res.json();

  if (data.errors) {
    return NextResponse.json({ error: 'Token exchange failed', details: data.errors }, { status: 500 });
  }

  const userId = "1f1f69ae-aff1-416b-8503-0f1358547e1e"; //oups :D!

  const { error } = await supabase
    .from('profiles')
    .update({
      strava_athlete_id: data.athlete.id,
      strava_access_token: data.access_token,
      strava_refresh_token: data.refresh_token,
      strava_expires_at: data.expires_at,
    })
    .eq('id', userId); 

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}