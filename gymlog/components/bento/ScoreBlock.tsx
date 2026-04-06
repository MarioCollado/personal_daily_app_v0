'use client'
import type { DailyMetrics } from '@/types'
import { clsx } from 'clsx'

interface Props {
  metrics: DailyMetrics | null
  hasWorkout: boolean
}

function computeScore(m: DailyMetrics | null, hasWorkout: boolean): { score: number; grade: string; color: string } {
  if (!m && !hasWorkout) return { score: 0, grade: '—', color: '#3f3f46' }

  let points = 0
  let total = 0

  // Sleep (25%)
  if (m?.sleep_hours != null) {
    total += 25
    const sh = m.sleep_hours
    if (sh >= 7 && sh <= 9) points += 25
    else if (sh >= 6 && sh <= 10) points += 18
    else if (sh >= 5) points += 10
    else points += 3
  }

  // Mood avg (25%)
  const moodVals = [m?.energy, m?.motivation].filter(v => v != null) as number[]
  const stressVals = [m?.stress].filter(v => v != null) as number[]
  if (moodVals.length) {
    total += 25
    const moodAvg = moodVals.reduce((a, b) => a + b, 0) / moodVals.length
    const stressAdj = stressVals.length ? (5 - stressVals[0]) / 4 : 0.5
    points += Math.round(((moodAvg / 5) * 0.7 + stressAdj * 0.3) * 25)
  }

  // Reading (25%)
  if (m?.pages_read != null) {
    total += 25
    if (m.pages_read >= 30) points += 25
    else if (m.pages_read >= 15) points += 18
    else if (m.pages_read >= 5) points += 10
    else points += 3
  }

  // Workout (25%)
  total += 25
  if (hasWorkout) points += 25

  const score = total > 0 ? Math.round((points / total) * 100) : 0

  let grade = '—'
  let color = '#3f3f46'
  if (score >= 90) { grade = 'S'; color = '#f59e0b' }
  else if (score >= 75) { grade = 'A'; color = '#22c55e' }
  else if (score >= 60) { grade = 'B'; color = '#3b82f6' }
  else if (score >= 40) { grade = 'C'; color = '#a855f7' }
  else if (score > 0) { grade = 'D'; color = '#ef4444' }

  return { score, grade, color }
}

export default function ScoreBlock({ metrics, hasWorkout }: Props) {
  const { score, grade, color } = computeScore(metrics, hasWorkout)

  const pillars = [
    { label: 'Sueño', done: metrics?.sleep_hours != null },
    { label: 'Estado', done: metrics?.energy != null },
    { label: 'Lectura', done: (metrics?.pages_read ?? 0) > 0 },
    { label: 'Entreno', done: hasWorkout },
  ]

  return (
    <div className="bento-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Score</span>
      </div>

      <div className="flex items-center gap-3 flex-1">
        {/* Big grade */}
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 64 64" className="w-14 h-14">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#1a1a1a" strokeWidth="6" />
            <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold font-mono" style={{ color }}>{grade}</span>
          </div>
        </div>

        {/* Pillars */}
        <div className="flex-1 space-y-1.5">
          {pillars.map(p => (
            <div key={p.label} className="flex items-center gap-2">
              <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', p.done ? 'bg-brand-500' : 'bg-surface-3')} />
              <span className={clsx('text-[11px]', p.done ? 'text-zinc-300' : 'text-zinc-700')}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* Number */}
        <div className="text-right flex-shrink-0">
          <span className="text-2xl font-mono font-bold" style={{ color }}>{score}</span>
          <div className="text-[10px] text-zinc-700">/100</div>
        </div>
      </div>
    </div>
  )
}
