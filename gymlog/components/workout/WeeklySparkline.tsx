'use client'

import { useMemo, useState } from 'react'
import { Activity, CalendarRange } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { clsx } from 'clsx'
import type { WorkoutHistoryWithExercises, SparklineMetric, SparklineRange } from '@/lib/workout-insights'
import { aggregateWorkoutSparkline } from '@/lib/workout-insights'

interface Props {
  workouts: WorkoutHistoryWithExercises[]
  currentDate: string
  className?: string
  defaultMetric?: SparklineMetric
  defaultRange?: SparklineRange
}

const metricLabels: Record<SparklineMetric, string> = {
  load: 'Carga',
  sessions: 'Sesiones',
}

const rangeLabels: Record<SparklineRange, string> = {
  '7d': '7 dias',
  '4w': '4 semanas',
}

function SparklineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-surface-border bg-surface-1/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="text-[11px] font-semibold text-main">{label}</p>
      <p className="mt-1 text-xs font-mono text-brand-400">{payload[0]?.value}</p>
    </div>
  )
}

function CustomDot(props: any) {
  const { cx, cy, payload } = props
  if (payload?.isCurrent) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="rgba(74, 222, 128, 0.14)" />
        <circle cx={cx} cy={cy} r={4.25} fill="var(--brand)" stroke="rgba(255,255,255,0.75)" strokeWidth={1.5} />
      </g>
    )
  }
  return <circle cx={cx} cy={cy} r={2.5} fill="rgba(161,161,170,0.8)" />
}

export default function WeeklySparkline({
  workouts,
  currentDate,
  className,
  defaultMetric = 'load',
  defaultRange = '4w',
}: Props) {
  const [metric, setMetric] = useState<SparklineMetric>(defaultMetric)
  const [range, setRange] = useState<SparklineRange>(defaultRange)

  const data = useMemo(
    () => aggregateWorkoutSparkline(workouts, currentDate, metric, range),
    [workouts, currentDate, metric, range]
  )

  const hasValues = data.some(item => item.value > 0)

  return (
    <section className={clsx('rounded-2xl border border-surface-border bg-surface-1/80 p-4 shadow-sm backdrop-blur-sm', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">Progreso</p>
          <p className="mt-1 text-sm font-semibold text-main">
            {metricLabels[metric]} · {rangeLabels[range]}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex rounded-xl border border-surface-border bg-surface-2/80 p-1">
            {(['load', 'sessions'] as SparklineMetric[]).map(option => (
              <button
                key={option}
                onClick={() => setMetric(option)}
                className={clsx(
                  'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all',
                  metric === option ? 'bg-brand-500/15 text-brand-300 shadow-sm' : 'text-muted hover:text-main'
                )}
              >
                {option === 'load' ? <Activity className="mr-1 inline h-3 w-3" /> : <CalendarRange className="mr-1 inline h-3 w-3" />}
                {metricLabels[option]}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-xl border border-surface-border bg-surface-2/80 p-1">
            {(['7d', '4w'] as SparklineRange[]).map(option => (
              <button
                key={option}
                onClick={() => setRange(option)}
                className={clsx(
                  'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all',
                  range === option ? 'bg-white/8 text-main shadow-sm' : 'text-muted hover:text-main'
                )}
              >
                {rangeLabels[option]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasValues ? (
        <>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Tooltip
                  content={<SparklineTooltip />}
                  cursor={{ stroke: 'rgba(161,161,170,0.18)', strokeWidth: 1 }}
                  labelFormatter={(_, items) => items?.[0]?.payload?.label}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#sparklineStroke)"
                  strokeWidth={2.4}
                  dot={<CustomDot />}
                  activeDot={{ r: 5, fill: 'var(--brand)' }}
                  isAnimationActive
                  animationDuration={450}
                />
                <defs>
                  <linearGradient id="sparklineStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(163,163,163,0.65)" />
                    <stop offset="100%" stopColor="var(--brand)" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            <span>{data[0]?.shortLabel}</span>
            <span>{data[data.length - 1]?.shortLabel}</span>
          </div>
        </>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-2/40 text-center">
          <p className="max-w-[15rem] text-xs font-medium text-muted">
            Cuando acumules sesiones, aqui veras tu tendencia de carga o frecuencia semanal.
          </p>
        </div>
      )}
    </section>
  )
}
