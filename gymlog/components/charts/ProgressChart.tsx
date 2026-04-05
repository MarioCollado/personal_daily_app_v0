'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface DataPoint {
  date: string
  maxWeight: number
  totalVolume: number
  sets: number
}

interface Props {
  data: DataPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-zinc-300 mb-1">{label}</p>
        <p className="text-brand-400 font-mono font-bold">{payload[0]?.value} kg</p>
      </div>
    )
  }
  return null
}

export default function ProgressChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#52525b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#52525b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="maxWeight"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#weightGradient)"
          dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#4ade80', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
