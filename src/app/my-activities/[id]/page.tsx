import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ActivityMap from '@/components/ActivityMap';
import { getValidToken } from '@/utils/strava';
import { HeartRateInteractive } from '@/components/HeartRateInteractive';
import ActivitySplits from '@/components/ActivitySplits';
import { BackButton } from '@/components/BackButton';

type Props = {
    params: Promise<{ id: string }>;
};

const fetchActivityById = async (id: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('activities')
        .select('*, activity_media(*), activity_splits(*)')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export function formatActivityData(activity: any) {
    const dateObj = new Date(activity.start_date);
    const date = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const time = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const distance = (activity.distance / 1000).toFixed(2);
    const h = Math.floor(activity.moving_time / 3600);
    const m = Math.floor((activity.moving_time % 3600) / 60);
    const s = activity.moving_time % 60;
    const duration = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;

    return {
        date,
        time,
        distance: `${distance} km`,
        duration,
        calories: activity.calories ? Math.round(activity.calories) : '--'
    };
}

const calculatePace = (speedMs: number) => {
    if (!speedMs || speedMs === 0) return "0:00";
    const totalSecondsPerKm = 1000 / speedMs;
    const minutes = Math.floor(totalSecondsPerKm / 60);
    const seconds = Math.round(totalSecondsPerKm % 60);
    return seconds === 60 ? `${minutes + 1}:00` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export async function getActivityStreams(userId: string, activityId: string) {
    const token = await getValidToken(userId);

    const response = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng,heartrate,time&key_by_type=true`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) throw new Error("Failed to fetch streams");

    const data = await response.json();
    const coordinates = data.latlng?.data.map((point: any) => [
        point[1],
        point[0]
    ]).filter((_: any, i: number) => i % 10 === 0) || [];

    const hrStream = data.heartrate?.data.map((bpm: number, index: number) => {
        const totalSeconds = data.time.data[index];
        return {
            time: totalSeconds,
            heartRate: bpm,
            timeLabel: formatTime(totalSeconds),
        };
    }) || [];

    return { coordinates, hrStream };
}

const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
};

export default async function ActivityDetailPage({ params }: Props) {
    const { id } = await params;
    const activity = await fetchActivityById(id);
    if (!activity) notFound();

    const streams = await getActivityStreams(activity.user_id, activity.strava_id.toString());
    const hrStream = streams?.hrStream || [];
    const coordinates = streams?.coordinates || [];

    const formattedData = formatActivityData(activity);
    const splits = activity.activity_splits || [];
    const splitSum = splits.reduce((acc: number, split: any) => acc + (split.calories || 0), 0);
    const displayCalories = splitSum > 0 ? Math.round(splitSum) : (activity.calories ? Math.round(activity.calories) : '--');

    const overallAverageSpeedMs = activity.distance / activity.moving_time;
    const overallPace = calculatePace(overallAverageSpeedMs);

    return (
        <main className="max-w-8xl mx-auto p-6 lg:p-12">
            <BackButton />
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-none">
                {activity.name}
            </h2>
            <p className="text-zinc-500 font-medium mt-2 mb-6">
                {formattedData.date} • {formattedData.time}
            </p>

            {/* 1. Main Stats Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-200 overflow-hidden mb-8">
                <div className="p-8 lg:p-12 grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                    <div className='flex flex-col md:pl-5'>
                        <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mb-1">Average Pace</span>
                        <h2 className="text-4xl font-black text-zinc-900">
                            {overallPace}<span className="text-lg font-bold text-zinc-300 ml-1">/km</span>
                        </h2>
                    </div>

                    <div className="flex flex-col border-l border-zinc-100 md:pl-8">
                        <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mb-1">Distance</span>
                        <h2 className="text-4xl font-black text-zinc-900">
                            {formattedData.distance.split(' ')[0]}<span className="text-lg font-bold text-zinc-300 ml-1">km</span>
                        </h2>
                    </div>

                    <div className="flex flex-col border-l border-zinc-100 md:pl-8">
                        <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mb-1">Moving Time</span>
                        <h2 className="text-4xl font-black text-zinc-900">{formattedData.duration}</h2>
                    </div>

                    <div className="flex flex-col border-l border-zinc-100 md:pl-8">
                        <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mb-1">Total Calories</span>
                        <h2 className="text-4xl font-black text-orange-500">
                            {displayCalories}<span className="text-lg font-bold text-zinc-300 ml-1">kcal</span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* 2. Map Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-200 overflow-hidden mb-8">
                <div className="w-full h-[450px] relative">
                    {coordinates && coordinates.length > 0 ? (
                        <ActivityMap coordinates={coordinates} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-zinc-400 italic bg-zinc-50/50">
                            No GPS data found
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                <div className="lg:col-span-1">
                    <ActivitySplits splits={activity.activity_splits} />
                </div>
                <div className="lg:col-span-2">
                    <HeartRateInteractive data={hrStream} />
                </div>
            </div>
        </main>
    );
}