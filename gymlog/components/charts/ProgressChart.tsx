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
        <p className="font-medium text-main mb-1">{label}</p>
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
            <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--surface-border)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="maxWeight"
          stroke="var(--brand)"
          strokeWidth={2}
          fill="url(#weightGradient)"
          dot={{ fill: 'var(--brand)', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'var(--brand)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
