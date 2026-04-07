'use client'
import { getGrade } from '@/styles/tokens'
import { card, text, bentoHeader } from '@/styles/components'
import { Flame } from 'lucide-react'
import { clsx } from 'clsx'

import type { DailyMetrics } from '@/types'

interface Props {
  metrics: DailyMetrics | null
  hasWorkout: boolean
}

// ─── Scoring con penalización ─────────
function computeScore(m: DailyMetrics | null, hasWorkout: boolean): number {
  type Pillar = { filled: boolean; points: number; max: number }
  const pillars: Pillar[] = []

  // Sueño
  {
    const filled = m?.sleep_hours != null
    let points = 0
    if (filled) {
      const h = m!.sleep_hours!
      if (h >= 7 && h <= 9) points = 25
      else if (h >= 6 && h <= 10) points = 18
      else if (h >= 5) points = 10
      else points = 3
    }
    pillars.push({ filled, points, max: 25 })
  }

  // Estado
  {
    const moodVals = [m?.energy, m?.motivation].filter((v): v is number => v != null)
    const stressVals = [m?.stress].filter((v): v is number => v != null)
    const filled = moodVals.length > 0
    let points = 0

    if (filled) {
      const moodAvg = moodVals.reduce((a, b) => a + b, 0) / moodVals.length
      const stressAdj = stressVals.length ? (5 - stressVals[0]) / 4 : 0.5
      points = Math.round(((moodAvg / 5) * 0.7 + stressAdj * 0.3) * 25)
    }

    pillars.push({ filled, points, max: 25 })
  }

  // Lectura
  {
    const filled = m?.pages_read != null && m.pages_read > 0
    let points = 0

    if (filled) {
      const p = m!.pages_read!
      if (p >= 30) points = 20
      else if (p >= 15) points = 14
      else if (p >= 5) points = 8
      else points = 3
    }

    pillars.push({ filled, points, max: 20 })
  }

  // Entreno
  pillars.push({ filled: hasWorkout, points: hasWorkout ? 20 : 0, max: 20 })

  // Tiempo libre
  {
    const filled = m?.free_time != null
    let points = 0

    if (filled) {
      const ft = m!.free_time!
      points = Math.round(((5 - ft) / 4) * 10)
    }

    pillars.push({ filled, points, max: 10 })
  }

  const rawPoints = pillars.reduce((a, p) => a + p.points, 0)
  const maxPoints = pillars.reduce((a, p) => a + p.max, 0)

  const empty = pillars.filter(p => !p.filled).length
  const penalty = empty * 8

  return Math.max(0, Math.round((rawPoints / maxPoints) * 100) - penalty)
}

export default function ScoreBlock({ metrics, hasWorkout }: Props) {
  const score = computeScore(metrics, hasWorkout)
  const { grade, color } = getGrade(score)

  const R = 26
  const CIRC = 2 * Math.PI * R

  const filled =
    [
      metrics?.sleep_hours != null,
      metrics?.energy != null,
      (metrics?.pages_read ?? 0) > 0,
      hasWorkout,
      metrics?.free_time != null
    ].filter(Boolean).length

  const total = 5

  // Background dinámico según score
  const bgColor =
    score >= 85
      ? 'bg-lime-400/10'
      : score >= 70
        ? 'bg-green-500/10'
        : score >= 55
          ? 'bg-yellow-400/10'
          : score > 0
            ? 'bg-red-500/10'
            : 'bg-zinc-800/40'

  const glow =
    score >= 85
      ? 'shadow-[0_0_25px_rgba(163,230,53,0.35)]'   // lime fosforito
      : score >= 70
        ? 'shadow-[0_0_18px_rgba(34,197,94,0.25)]'  // green apagado
        : score >= 55
          ? 'shadow-[0_0_14px_rgba(250,204,21,0.25)]' // yellow
          : score > 0
            ? 'shadow-[0_0_10px_rgba(239,68,68,0.25)]' // red
            : ''

  return (
    <div className={clsx(card.bento, bgColor, glow, 'flex flex-col h-full p-4 transition-all')}>
      {/* Header */}
      <div className="relative flex items-center justify-center mb-2 min-h-[20px]">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">
            Vitalidad
          </span>
        </div>

        <span className="absolute right-0 text-[10px] text-zinc-700">
          {filled}/{total}
        </span>
      </div>

      {/* Center */}
      <div className="flex items-center justify-center flex-1">
        <div className="relative">
          <svg viewBox="0 0 64 64" className="w-20 h-20">
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${CIRC}`}
              strokeDashoffset={`${CIRC * (1 - score / 100)}`}
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>

          {/* Number inside */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span
              className="text-2xl font-bold font-mono leading-none"
              style={{ color }}
            >
              {score}
            </span>
            <span className="text-[10px] text-zinc-600">/100</span>
          </div>
        </div>
      </div>

      {/* Penalty hint */}
      {filled < total && (
        <div className="text-[10px] text-red-700 text-center mt-1">
          -{(total - filled) * 8} pen.
        </div>
      )}
    </div>
  )
}