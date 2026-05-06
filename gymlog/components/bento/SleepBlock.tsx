'use client'
import { useState, useRef, useCallback } from 'react'
import { Moon } from 'lucide-react'
import { clsx } from 'clsx'
import { useI18n } from '@/contexts/I18nContext'

interface Props {
  value: number | null
  onChange: (hours: number) => void
  saving?: boolean
}

const MIN = 1
const MAX = 14
const START_DEG = 150
const TOTAL_DEG = 240

function getSleepColor(h: number | null): string {
  if (h === null) return 'var(--text-muted)'
  if (h < 5) return '#ef4444'
  if (h < 6) return '#f97316'
  if (h < 7) return '#eab308'
  if (h <= 8.5) return '#22c55e'
  return '#3b82f6'
}

const CX = 60, CY = 60, R = 46
const CIRCUMFERENCE = 2 * Math.PI * R
const TRACK_FRACTION = TOTAL_DEG / 360

function valueToFraction(v: number): number {
  return (v - MIN) / (MAX - MIN)
}

function getThumbPoint(fraction: number) {
  const angleDeg = START_DEG + fraction * TOTAL_DEG
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: CX + R * Math.cos(angleRad),
    y: CY + R * Math.sin(angleRad),
  }
}

export default function SleepBlock({ value, onChange, saving }: Props) {
  const { t } = useI18n()
  const [dragging, setDragging] = useState(false)
  const [localVal, setLocalVal] = useState<number | null>(value)
  const svgRef = useRef<SVGSVGElement>(null)

  const getSleepLabel = (h: number | null): string => {
    if (h === null) return '—'
    if (h < 5) return t('dashboard.sleep_block.labels.poor')
    if (h < 6) return t('dashboard.sleep_block.labels.good')
    if (h < 7) return t('dashboard.sleep_block.labels.adequate')
    if (h <= 8.5) return t('dashboard.sleep_block.labels.optimal')
    return t('dashboard.sleep_block.labels.excessive')
  }

  const handleInteract = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = 120 / rect.width
    const scaleY = 120 / rect.height
    const svgX = (clientX - rect.left) * scaleX
    const svgY = (clientY - rect.top) * scaleY
    const dx = svgX - CX
    const dy = svgY - CY

    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
    if (angleDeg < 0) angleDeg += 360

    let delta = angleDeg - START_DEG
    if (delta < 0) delta += 360

    const fraction = Math.min(1, Math.max(0, delta / TOTAL_DEG))
    const raw = MIN + fraction * (MAX - MIN)
    const snapped = Math.round(raw * 2) / 2
    setLocalVal(Math.min(MAX, Math.max(MIN, snapped)))
  }, [])

  function commit() {
    if (localVal !== null) onChange(localVal)
    setDragging(false)
  }

  const display = localVal ?? value
  const color = getSleepColor(display)
  const fraction = display !== null ? valueToFraction(display) : 0
  const thumb = display !== null ? getThumbPoint(fraction) : null

  const trackDash = CIRCUMFERENCE * TRACK_FRACTION
  const trackGap = CIRCUMFERENCE * (1 - TRACK_FRACTION)

  const progressDash = CIRCUMFERENCE * TRACK_FRACTION * fraction
  const progressGap = CIRCUMFERENCE - progressDash

  return (
    <div className="bento-card flex flex-col h-full">
      <div className="relative flex items-center justify-center mb-2 lg:mb-3 min-h-[20px]">
        <div className="flex items-center gap-1.5">
          <Moon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-400" />
          <span className="text-[11px] lg:text-xs font-bold text-muted uppercase tracking-widest">{t('dashboard.sleep_block.title')}</span>
        </div>
        {saving && <span className="absolute right-0 text-[10px] text-muted animate-pulse-dot">{t('dashboard.sleep_block.saving')}</span>}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox="0 0 120 120"
          className="w-full max-w-[140px] lg:max-w-[170px] cursor-pointer select-none touch-none"
          onMouseDown={e => { setDragging(true); handleInteract(e.clientX, e.clientY) }}
          onMouseMove={e => dragging && handleInteract(e.clientX, e.clientY)}
          onMouseUp={commit}
          onMouseLeave={() => dragging && commit()}
          onTouchStart={e => { setDragging(true); handleInteract(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchMove={e => { e.preventDefault(); handleInteract(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={commit}
        >
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="currentColor"
            className="text-surface-border/50"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${trackDash} ${trackGap}`}
            transform={`rotate(${START_DEG} ${CX} ${CY})`}
          />

          {display !== null && fraction > 0 && (
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progressDash} ${progressGap}`}
              transform={`rotate(${START_DEG} ${CX} ${CY})`}
              style={{ transition: dragging ? 'none' : 'stroke 0.3s ease, stroke-dasharray 0.15s ease' }}
            />
          )}

          {thumb && (
            <circle
              cx={thumb.x} cy={thumb.y} r="6"
              fill={color}
              stroke="var(--surface-0)"
              strokeWidth="2"
            />
          )}

          <text x="60" y="54" textAnchor="middle" fill="var(--text-main)" fontSize="22" fontWeight="700" fontFamily="monospace">
            {display !== null ? display : '—'}
          </text>
          <text x="60" y="67" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
            {display !== null ? t('dashboard.sleep_block.hours_unit') : t('dashboard.sleep_block.tap_to_edit')}
          </text>
          <text x="60" y="78" textAnchor="middle" fontSize="7.5" fontWeight="600"
            fill={display !== null ? color : 'var(--text-muted)'}>
            {getSleepLabel(display)}
          </text>
        </svg>
      </div>

      <div className="flex justify-between mt-1 lg:mt-2 gap-1">
        {[5, 6, 7, 8, 9].map(h => (
          <button
            key={h}
            onClick={() => { setLocalVal(h); onChange(h) }}
            className={clsx(
              'flex-1 text-[11px] lg:text-xs font-mono py-1 lg:py-1.5 rounded-lg transition-all duration-200',
              display === h 
                ? 'bg-brand-500 text-brand-foreground font-bold shadow-sm' 
                : 'bg-surface-2 text-muted hover:text-main hover:bg-surface-3'
            )}
            style={{ backgroundColor: display === h ? color : undefined }}
          >
            {h}h
          </button>
        ))}
      </div>
    </div>
  )
}
