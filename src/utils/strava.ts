import { createClient } from '@/utils/supabase/server';

export async function getValidToken(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('strava_access_token, strava_refresh_token, strava_expires_at')
    .eq('id', userId)
    .single();


  if (error || !profile) throw new Error("Profile not found");

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = profile.strava_expires_at;

  if (expiresAt > nowInSeconds) {
    console.log("Token is still good!", profile.strava_access_token);
    return profile.strava_access_token;
  } else {
    console.log("Token is expired, need to refresh.");
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: profile.strava_refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  await supabase
    .from('profiles')
    .update({
      strava_access_token: data.access_token,
      strava_refresh_token: data.refresh_token,
      strava_expires_at: data.expires_at,
    })
    .eq('id', userId);

  return data.access_token;
}