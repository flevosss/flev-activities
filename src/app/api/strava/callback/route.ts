import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const supabase = await createClient();

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  await supabase.from('profiles').upsert({
    id: user.id,
    strava_athlete_id: data.athlete.id,
    strava_access_token: data.access_token,
    strava_refresh_token: data.refresh_token,
    strava_expires_at: data.expires_at,
  });

  return NextResponse.redirect(new URL('/dashboard', request.url));
}