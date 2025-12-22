export default function ConnectStrava() {
  const clientID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const redirectUri = `https://${process.env.NEXT_PUBLIC_SITE_URL}/api/strava/callback`;
  
  const scope = "read,activity:read_all";
  
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;

  return (
    <a href={authUrl} className="bg-[#FC4C02] text-white px-6 py-2 rounded-md font-bold">
      Connect with Strava
    </a>
  );
}