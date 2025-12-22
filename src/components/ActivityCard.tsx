import Image from "next/image";
import { Turtle, BicepsFlexed, Activity, Footprints } from "lucide-react";

interface ActivityCardProps {
    type: string;
    title: string;
    location: string;
    time: string;
    distance: string;
    isNew: boolean;
    id: string;
    media: Array<{
        strava_unique_id: string;
        media_type: string;
        url: string;
        video_url: string;
    }>;
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
    Run: Turtle,
    Hike: Footprints,
    WeightTraining: BicepsFlexed,
    default: Activity
};

const getRandomImageForActivity = (media: ActivityCardProps["media"], activityId: string) => {
    if (!media || media.length === 0 || media.filter(m => m.media_type === 'photo').length === 0) {
        return '/powered-by-strava.svg';
    }

    const availableImages = media.filter(m => m.media_type === 'photo').map(m => m.url);

    const seed = activityId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const stableIndex = seed % availableImages.length;

    return availableImages[stableIndex];
}

export default function ActivityCard({ id, type, title, location, time, distance, isNew, media, }: ActivityCardProps) {
    const Icon = ACTIVITY_ICONS[type] || ACTIVITY_ICONS.default;
    const displayImage = getRandomImageForActivity(media, id);
    return (
        <div className="relative bg-white rounded-3xl p-5 flex items-center gap-4 shadow-lg border border-zinc-100">

            {isNew && (
                <div className="absolute -top-3 -right-3 bg-orange-600 text-[10px] font-black uppercase tracking-tighter text-white px-3 py-1.5 rounded-xl shadow-lg z-20">
                    New
                </div>
            )}

            {/* Left section which has an image */}
            <div className="flex-shrink-0">
                <div className="relative w-32 h-32 rounded-3xl overflow-hidden bg-gray-100 border-orange-400 border-[3px]">
                    <Image
                        src={displayImage}
                        alt={title}
                        fill 
                        sizes="128px" 
                        className="object-cover" 
                    />
                </div>
            </div>

            {/* Center which has the info */}
            <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Icon className="w-7 h-7 text-black-400" />
                    {title}
                </h3>

                <div className="flex items-center gap-2 text-gray-500 font-medium">
                    <span>{time}</span>
                    <span>•</span>
                    <span>{location}</span>
                    <span>•</span>
                    <span className="font-bold text-zinc-900">{distance}</span>
                </div>
            </div>

            {/* Right side is just the icon to go inside the activity*/}
            <div className="flex-shrink-0 text-gray-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </div>
        </div>
    );
}