"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  heartRate: {
    label: "BPM",
  },
} satisfies ChartConfig

interface HeartRatePoint {
  time: number
  timeLabel: string
  heartRate: number
}

const zones = [
   { label: 'Z5', color: 'var(--hr-zone5)' },
   { label: 'Z4', color: 'var(--hr-zone4)' },
   { label: 'Z3', color: 'var(--hr-zone3)' },
   { label: 'Z2', color: 'var(--hr-zone2)' },
   { label: 'Z1', color: 'var(--hr-zone1)' },
];

export function HeartRateInteractive({ data }: { data: HeartRatePoint[] }) {

  const bpmValues = data.map(d => d.heartRate);
  const minBpm = Math.min(...bpmValues);
  const maxBpm = Math.max(...bpmValues);
  const avgBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
  const range = maxBpm - minBpm;

  const getOffset = (bpm: number) => {
    const offset = 100 - ((bpm - minBpm) / range) * 100;
    return `${Math.max(0, Math.min(100, offset))}%`;
  };

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden flex flex-col bg-white h-full">
        <CardContent className="flex flex-col items-center justify-center flex-1 p-12 text-center min-h-[400px]">
          <div className="flex items-center justify-center h-full text-zinc-400 italic bg-zinc-50/50">
                            No heart rate data found
                        </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden h-full flex flex-col bg-white">
      <CardHeader className="px-8 pt-2 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-zinc-400 font-bold uppercase tracking-widest text-sm">
               Heart Rate Intensity
            </CardTitle>
          </div>
          
          <div className="flex gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
            {zones.reverse().map((zone) => (
              <div key={zone.label} className="flex flex-col items-center gap-1">
                <div 
                  className="w-7 h-1.5 rounded-full" 
                  style={{ backgroundColor: `hsl(${zone.color})` }}
                />
                <span className="text-[8px] font-black text-zinc-400">{zone.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 flex-1">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={getOffset(180)} stopColor="hsl(var(--hr-zone5))" />
                  <stop offset={getOffset(165)} stopColor="hsl(var(--hr-zone4))" />
                  <stop offset={getOffset(150)} stopColor="hsl(var(--hr-zone3))" />
                  <stop offset={getOffset(135)} stopColor="hsl(var(--hr-zone2))" />
                  <stop offset="100%" stopColor="hsl(var(--hr-zone1))" />
                </linearGradient>
              </defs>
              
              <CartesianGrid vertical={false} stroke="#f4f4f5" strokeDasharray="3 3" />
              
              <XAxis
                dataKey="timeLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={100}
                tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }}
              />
              
              <YAxis 
                domain={[minBpm - 5, maxBpm + 5]} 
                hide 
              />
              
              <ChartTooltip
                cursor={{ stroke: '#e4e4e7', strokeWidth: 2 }}
                content={
                  <ChartTooltipContent 
                    hideLabel 
                    className="bg-white border-zinc-200 shadow-lg rounded-xl font-bold"
                  />
                }
              />
              
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="url(#hrGradient)"
                strokeWidth={4}
                dot={false}
                activeDot={{ r: 6, fill: "#18181b", strokeWidth: 2, stroke: "#fff" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>

      <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-2">
        <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Lowest</span>
            <span className="text-xl font-black text-zinc-900">
              {minBpm} <span className="text-[10px] font-bold text-zinc-300">BPM</span>
            </span>
          </div>
          <div className="flex flex-col border-l border-zinc-200 pl-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Average</span>
            <span className="text-xl font-black text-zinc-900">
              {avgBpm} <span className="text-[10px] font-bold text-zinc-300">BPM</span>
            </span>
          </div>
          <div className="flex flex-col border-l border-zinc-200 pl-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Highest</span>
            <span className="text-xl font-black text-red-500">
              {maxBpm} <span className="text-[10px] font-bold text-zinc-300">BPM</span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}