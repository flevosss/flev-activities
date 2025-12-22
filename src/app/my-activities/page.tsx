import { createClient } from '@/utils/supabase/server';
import ActivityCard from '@/components/ActivityCard';
import Link from 'next/link';

const formatActivity = (activity: any) => {
    const distanceKm = `${(activity.distance / 1000).toFixed(2)} km`;

    const dateFormatted = new Date(activity.start_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return {
        id: activity.strava_id.toString(),
        type: activity.type,
        title: activity.name,
        location: "Outdoor",
        time: dateFormatted,
        distance: distanceKm,
        isNew: isActivityNew(activity.start_date),
        media: activity.activity_media || [],
    };
};

const isActivityNew = (startDate: string): boolean => {
    const TWO_DAY_MS = 48 * 60 * 60 * 1000;
    return Date.now() - new Date(startDate).getTime() < TWO_DAY_MS;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
    searchParams: Promise<{ page?: string }>;
};

export default async function StatsPage({ searchParams }: Props) {

    const supabase = await createClient();

    const resolvedParams = await searchParams;
    const currentPage = Number(resolvedParams.page) || 1;
    const itemsPerPage = 3;


    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data: activities, count } = await supabase
        .from('activities')
        .select(`
            *,
            activity_media (
                strava_unique_id,
                media_type,
                url,
                video_url
            )
        `, { count: 'exact' })
        .order('start_date', { ascending: false })
        .range(from, to);
        
    const totalPages = Math.ceil((count || 0) / itemsPerPage);

    return (
        <main className="max-w-xl p-6 bg-zinc-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-4xl font-black text-orange-600 tracking-tight">
                    All my Activities
                </h1>   
            </header>

            <div className="flex flex-col gap-6">
                {activities?.map((activity) => (
                    <ActivityCard
                        key={activity.strava_id}
                        {...formatActivity(activity)}
                    />
                ))}

                <div className="flex justify-between items-center mt-5">
                    <Link
                        href={`/my-activities?page=${currentPage - 1}`}
                        className={`border px-4 py-1.5 rounded-xl font-bold text-cyan-900 bg-white hover:bg-cyan-800 hover:text-white border-cyan-900 ${currentPage <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        Previous
                    </Link>

                    <span className="font-medium text-zinc-500">
                        - Page {currentPage} of {totalPages} -
                    </span>

                    <Link
                        href={`/my-activities?page=${currentPage + 1}`}
                        className={`border px-4 py-1.5 rounded-xl font-bold text-orange-600 bg-white hover:bg-orange-400 hover:text-white border-orange-400 ${currentPage >= totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        Next
                    </Link>
                </div>

                {(!activities || activities.length === 0) && (
                    <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-zinc-300">
                        <p className="text-zinc-400 font-medium">No activities found.</p>
                    </div>
                )}
            </div>
        </main>
    );
}