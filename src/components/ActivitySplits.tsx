"use client"

interface Split {
    id: string | number
    split_number: number
    average_speed: number
}

interface ActivitySplitsProps {
    splits: Split[]
}

const formatPace = (speed: number) => {
    if (!speed || speed === 0) return "0:00";
    const paceSeconds = 1000 / speed;
    const mins = Math.floor(paceSeconds / 60);
    const secs = Math.round(paceSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ActivitySplits({ splits }: ActivitySplitsProps) {
    const fastestSpeed = Math.max(...(splits?.map((s) => s.average_speed) || [0]));

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-200 overflow-hidden">
            <div className="p-8 lg:p-10 flex flex-col h-full">
                <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-6 px-2">
                    Kilometer Splits
                </h3>

                <div className="grid grid-cols-2 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                    <span>Split</span>
                    <span className="text-right">Pace</span>
                </div>

                <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-1">
                        {[...splits]
                            .sort((a, b) => a.split_number - b.split_number)
                            .map((split) => {
                                const isFastest = split.average_speed === fastestSpeed
                                return (
                                    <div
                                        key={split.id}
                                        className={`grid grid-cols-2 px-6 py-4 rounded-2xl transition-all border ${isFastest
                                                ? "bg-orange-50/40 border-orange-100"
                                                : "hover:bg-zinc-50 border-transparent hover:border-zinc-100"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`font-bold ${isFastest ? "text-orange-500" : "text-zinc-400"
                                                    }`}
                                            >
                                                {split.split_number}
                                            </span>
                                            {isFastest && (
                                                <span className="text-[8px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase">
                                                    Fastest
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-baseline justify-end gap-1">
                                            <span
                                                className={`text-xl font-black ${isFastest ? "text-orange-600" : "text-zinc-900"
                                                    }`}
                                            >
                                                {formatPace(split.average_speed)}
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-300">/km</span>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </div>
            </div>
        </div>
    )
}