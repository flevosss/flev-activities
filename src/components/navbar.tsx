import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  return (
    <aside className="h-screen w-64 bg-cyan-950 text-white flex flex-col border-r border-slate-800 sticky top-0 shadow-lg">
      <Link
        href="/dashboard"
        className="mx-auto rounded-full w-24 h-24 bg-white overflow-hidden mt-5  shadow-inner flex items-center justify-center"
      >
        <Image
          src="/me-strava.jpg" 
          alt="Profile"
          width={96}  
          height={96} 
          className="w-full h-full object-cover"
        />
      </Link>

      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/activitymap"
          className="block p-3 rounded-full hover:bg-slate-800 transition-colors"
        >
          Activity Map
        </Link>

        <Link
          href="/recent-activities"
          className="block p-3 rounded-full hover:bg-slate-800 transition-colors"
        >
          Recent Activities
        </Link>

        <Link
          href="/my-activities"
          className="block p-3 rounded-full hover:bg-slate-800 transition-colors"
        >
          All My Activities
        </Link>
      </nav>
      <Image className="mx-auto" src="/powered-by-strava.svg" alt="strava-logo" width={150} height={150} />
      <p className="text-center text-sm text-gray-400 mb-2">Made with ❤️ by Michalis Flevaris</p>
    </aside>
  )
}