'use client'
import { useState } from 'react'
import { getGrade } from '@/styles/tokens'
import { card, btn } from '@/styles/components'
import { Flame, X, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { computeVitalityScore } from '@/lib/vitality'
import { useI18n } from '@/contexts/I18nContext'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

import type { DailyMetrics, Exercise, UserProfile, WorkoutWithExercises, TodayArtsSummary } from '@/types'

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max)
}

function ScoreSparkline({ scores }: { scores: number[] }) {
  if (!scores || scores.length < 2) return null

  const width = 100
  const height = 24
  const paddingX = 4
  const paddingY = 4

  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const range = Math.max(maxScore - minScore, 10)

  const points = scores.map((score, i) => {
    const x = paddingX + (i / (scores.length - 1)) * (width - 2 * paddingX)
    const y = height - paddingY - ((score - minScore) / range) * (height - 2 * paddingY)
    return `${x},${y}`
  }).join(' ')

  const lastScore = scores[scores.length - 1]
  const prevScore = scores[scores.length - 2]
  const trendColor = lastScore > prevScore ? '#22c55e' : lastScore < prevScore ? '#ef4444' : '#a1a1aa'

  const lastX = paddingX + width - 2 * paddingX
  const lastY = height - paddingY - ((lastScore - minScore) / range) * (height - 2 * paddingY)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-6 mt-2 overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-brand-400 opacity-40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={trendColor} />
    </svg>
  )
}

function ExpandedSparkline({ scores, color }: { scores: number[], color: string }) {
  if (!scores || scores.length < 2) return null

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return days[d.getDay()]
  })

  const activeLabels = labels.slice(7 - scores.length)

  const width = 300
  const height = 48
  const paddingX = 12
  const paddingY = 6

  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const range = Math.max(maxScore - minScore, 10)

  const coords = scores.map((score, i) => {
    const x = paddingX + (i / (scores.length - 1)) * (width - 2 * paddingX)
    const y = height - paddingY - ((score - minScore) / range) * (height - 2 * paddingY)
    return { x, y, score }
  })

  const points = coords.map(c => `${c.x},${c.y}`).join(' ')

  return (
    <div className="mt-6 pt-6 border-t border-surface-border">
      <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4 text-center">
        Tendencia (7 días)
      </h4>
      <div className="relative w-full aspect-[300/60]">
        <svg viewBox={`0 0 ${width} ${height + 16}`} className="w-full h-full overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-surface-border"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coords.map((c, i) => {
            const isLast = i === coords.length - 1
            return (
              <g key={i}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isLast ? "4" : "3"}
                  fill={isLast ? color : "currentColor"}
                  className={isLast ? "" : "text-muted"}
                />
                <text
                  x={c.x}
                  y={height + 14}
                  textAnchor="middle"
                  className={clsx("text-[9px] font-medium", isLast ? "fill-main font-bold" : "fill-muted")}
                >
                  {activeLabels[i]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function ScoreDetailModal({
  score,
  color,
  grade,
  hint,
  breakdown,
  historicalScores,
  onClose,
}: {
  score: number
  color: string
  grade: string
  hint: string
  breakdown: any
  historicalScores?: number[]
  onClose: () => void
}) {
  const recVal = clamp((breakdown.recovery - 20) / 55 * 100, 0, 100)
  const effVal = clamp(breakdown.effort / 78 * 100, 0, 100)
  const balVal = clamp((breakdown.balanceModifier - 0.72) / 0.56 * 100, 0, 100)
  const artsVal = clamp(breakdown.readiness * 100, 0, 100)
  const penVal = clamp(breakdown.fatiguePenalty, 0, 100)

  let data = [
    { name: 'Recuperación', value: recVal, color: '#22c55e', desc: 'Sueño, estrés y estado mental' },
    { name: 'Esfuerzo', value: effVal, color: '#3b82f6', desc: 'Carga del entrenamiento de hoy' },
    { name: 'Balance', value: balVal, color: '#f59e0b', desc: 'Equilibrio esfuerzo vs recuperación' },
    { name: 'Hábitos', value: artsVal, color: '#a855f7', desc: 'Artes, lectura y tiempo libre' },
  ]

  if (penVal > 0) {
    data.sort((a, b) => b.value - a.value)
    data[0].value = Math.max(0, data[0].value - penVal)
    
    data.push({
      name: 'Penalización',
      value: penVal,
      color: '#ef4444',
      desc: 'Fatiga acumulada o incoherencia'
    })
  }

  const legendData = [...data].sort((a, b) => {
    const order = ['Recuperación', 'Esfuerzo', 'Balance', 'Hábitos', 'Penalización']
    return order.indexOf(a.name) - order.indexOf(b.name)
  })

  const HINTS_ES: Record<string, string> = {
    low_confidence: "Pocos datos para calcular con precisión",
    rest_day: "Buena recuperación — día ideal para descansar",
    fatigue: "Fatiga acumulada detectada",
    overload: "Esfuerzo superior a la recuperación",
    balanced: "Equilibrio óptimo esfuerzo/recuperación",
    stable: "Estado estable",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in touch-manipulation">
      <div className={clsx(card.base, 'rounded-t-2xl w-full max-w-lg p-5 animate-slide-up max-h-[90vh] overflow-y-auto')}>
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-bold text-xl text-main flex items-center gap-2">
              Vitalidad
              <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white shadow-sm" style={{ backgroundColor: color }}>
                {grade}
              </span>
            </h3>
            <p className="text-sm text-muted mt-1 font-medium">
              {HINTS_ES[hint] || hint}
            </p>
          </div>
          <button onClick={onClose} className={clsx(btn.icon, 'bg-surface-2 hover:bg-surface-3')}>
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Donut Chart */}
        <div className="relative h-[220px] sm:h-[240px] w-full flex items-center justify-center mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="90%"
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-bold font-mono leading-none" style={{ color }}>
              {score}
            </span>
            <span className="text-xs font-bold text-muted mt-1 uppercase tracking-widest">Score</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {legendData.map((item) => (
            <div key={item.name} className="flex flex-col p-3 rounded-xl bg-surface-1 border border-surface-border">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-bold text-main">{item.name}</span>
                </div>
                <span className="font-mono text-sm font-bold" style={{ color: item.color }}>
                  {item.value > 0 ? Math.round(item.value) : 0}
                </span>
              </div>
              <p className="text-xs text-muted font-medium pl-4.5 ml-4">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Historical Sparkline */}
        {historicalScores && historicalScores.length >= 2 && (
          <ExpandedSparkline scores={historicalScores} color={color} />
        )}
        
      </div>
    </div>
  )
}

interface Props {
  metrics: DailyMetrics | null
  hasWorkout: boolean
  profile: UserProfile | null
  recentMetrics: DailyMetrics[]
  recentWorkouts: WorkoutWithExercises[]
  todayExercises: Exercise[]
  artsSummary?: TodayArtsSummary | null
  historicalScores?: number[]
}

export default function ScoreBlock({
  metrics,
  hasWorkout,
  profile,
  recentMetrics,
  recentWorkouts,
  todayExercises,
  artsSummary,
  historicalScores,
}: Props) {
  const { t } = useI18n()
  const [showDetail, setShowDetail] = useState(false)

  const result = computeVitalityScore({
    profile,
    metrics,
    recentMetrics,
    recentWorkouts,
    todayExercises,
    hasWorkout,
    artsSummary,
  })

  const score = result.score
  const { color, grade } = getGrade(score)

  const R = 26
  const CIRC = 2 * Math.PI * R

  const filled = [
    metrics?.sleep_hours != null,
    metrics?.energy != null,
    (artsSummary?.totalObservationMinutes ?? 0) > 0 || (artsSummary?.totalPracticeMinutes ?? 0) > 0,
    hasWorkout,
    metrics?.phone_usage != null,
  ].filter(Boolean).length

  const total = 5
  const lowConfidence = result.breakdown.confidence < 0.55

  const bgColor =
    score >= 85
      ? 'bg-lime-400/10 hover:bg-lime-400/20'
      : score >= 70
        ? 'bg-green-500/10 hover:bg-green-500/20'
        : score >= 55
          ? 'bg-yellow-400/10 hover:bg-yellow-400/20'
          : score > 0
            ? 'bg-red-500/10 hover:bg-red-500/20'
            : 'bg-surface-3/40 hover:bg-surface-3/60'

  const glow =
    score >= 85
      ? 'shadow-[0_0_25px_rgba(163,230,53,0.35)]'
      : score >= 70
        ? 'shadow-[0_0_18px_rgba(34,197,94,0.25)]'
        : score >= 55
          ? 'shadow-[0_0_14px_rgba(250,204,21,0.25)]'
          : score > 0
            ? 'shadow-[0_0_10px_rgba(239,68,68,0.25)]'
            : ''

  return (
    <>
      <div 
        onClick={() => setShowDetail(true)}
        className={clsx(card.bento, bgColor, glow, 'relative flex flex-col h-full transition-all cursor-pointer group touch-manipulation')}
      >
        <div className="relative flex items-center justify-between mb-2 lg:mb-3 min-h-[20px]">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />
            <span className="text-[11px] lg:text-xs font-bold text-muted uppercase tracking-widest group-hover:text-main transition-colors">
              {t('dashboard.vitality.title')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] lg:text-xs font-medium text-muted/60">
              {filled}/{total}
            </span>
            <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-muted/40 group-hover:text-main transition-colors" />
          </div>
        </div>

        <div className="flex items-center justify-center flex-1 min-h-[80px] lg:min-h-[120px]">
          <div className="relative">
            <svg viewBox="0 0 64 64" className="w-20 h-20 lg:w-28 lg:h-28">
              <circle
                cx="32"
                cy="32"
                r={R}
                fill="none"
                stroke="currentColor"
                className="text-surface-border"
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

            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span
                className="text-2xl lg:text-3xl font-bold font-mono leading-none"
                style={{ color }}
              >
                {score}
              </span>
              <span className="text-[10px] lg:text-xs text-muted font-bold tracking-tighter">/100</span>
            </div>
          </div>
        </div>

        {historicalScores && historicalScores.length >= 2 ? (
          <ScoreSparkline scores={historicalScores} />
        ) : (
          <div className={clsx('text-[10px] lg:text-xs text-center mt-2 lg:mt-3 font-medium min-h-[28px]', lowConfidence ? 'text-yellow-300' : 'text-muted')}>
            {t(`dashboard.vitality.hints.${result.hint}`)}
          </div>
        )}
      </div>

      {showDetail && (
        <ScoreDetailModal
          score={score}
          color={color}
          grade={grade}
          hint={result.hint}
          breakdown={result.breakdown}
          historicalScores={historicalScores}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}
