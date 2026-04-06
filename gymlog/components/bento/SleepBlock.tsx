'use client'
import { useState, useRef, useCallback } from 'react'
import { Moon } from 'lucide-react'
import { clsx } from 'clsx'

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
  if (h === null) return '#3f3f46'
  if (h < 5) return '#ef4444'
  if (h < 6.5) return '#f97316'
  if (h < 7.5) return '#eab308'
  if (h <= 9) return '#22c55e'
  return '#3b82f6'
}

function getSleepLabel(h: number | null): string {
  if (h === null) return '—'
  if (h < 5) return 'Poco'
  if (h < 6.5) return 'Bien'
  if (h < 7.5) return 'Óptimo'
  if (h <= 9) return 'Mucho'
  return 'Demasiado'
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
  const [dragging, setDragging] = useState(false)
  const [localVal, setLocalVal] = useState<number | null>(value)
  const svgRef = useRef<SVGSVGElement>(null)

  // Convert pointer position → value
  const handleInteract = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    // Map to SVG coordinate space (viewBox 0 0 120 120)
    const scaleX = 120 / rect.width
    const scaleY = 120 / rect.height
    const svgX = (clientX - rect.left) * scaleX
    const svgY = (clientY - rect.top) * scaleY
    const dx = svgX - CX
    const dy = svgY - CY

    // atan2 gives angle in [-180, 180], 0 = right (3 o'clock)
    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
    // Normalize to [0, 360)
    if (angleDeg < 0) angleDeg += 360

    // Map angle to fraction along our arc
    // Arc starts at START_DEG and sweeps TOTAL_DEG clockwise
    let delta = angleDeg - START_DEG
    if (delta < 0) delta += 360

    // Clamp to arc range
    const fraction = Math.min(1, Math.max(0, delta / TOTAL_DEG))
    const raw = MIN + fraction * (MAX - MIN)
    // Snap to 0.5h steps
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

  // strokeDasharray trick:
  // The full circle circumference = 2πR
  // We draw only TRACK_FRACTION of it (240/360 = 2/3)
  // We rotate the circle so the track starts at START_DEG
  // rotateZ offset: SVG 0° = 3 o'clock; we want track start at START_DEG
  const rotateOffset = START_DEG  // degrees to rotate the circle

  const trackDash = CIRCUMFERENCE * TRACK_FRACTION
  const trackGap = CIRCUMFERENCE * (1 - TRACK_FRACTION)

  const progressDash = CIRCUMFERENCE * TRACK_FRACTION * fraction
  // gap fills remaining circumference so only the progress segment shows
  const progressGap = CIRCUMFERENCE - progressDash

  return (
    <div className="bento-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Moon className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Sueño</span>
        </div>
        {saving && <span className="text-[10px] text-zinc-600 animate-pulse-dot">guardando</span>}
      </div>

      {/* SVG Dial */}
      <div className="flex-1 flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox="0 0 120 120"
          className="w-full max-w-[140px] cursor-pointer select-none touch-none"
          onMouseDown={e => { setDragging(true); handleInteract(e.clientX, e.clientY) }}
          onMouseMove={e => dragging && handleInteract(e.clientX, e.clientY)}
          onMouseUp={commit}
          onMouseLeave={() => dragging && commit()}
          onTouchStart={e => { setDragging(true); handleInteract(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchMove={e => { e.preventDefault(); handleInteract(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={commit}
        >
          {/* Track (grey arc, 240°) */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="#1f1f1f"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${trackDash} ${trackGap}`}
            transform={`rotate(${rotateOffset} ${CX} ${CY})`}
          />

          {/* Progress arc — same trick, fraction of track */}
          {display !== null && fraction > 0 && (
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progressDash} ${progressGap}`}
              transform={`rotate(${rotateOffset} ${CX} ${CY})`}
              style={{ transition: dragging ? 'none' : 'stroke 0.3s ease, stroke-dasharray 0.15s ease' }}
            />
          )}

          {/* Thumb dot */}
          {thumb && (
            <circle
              cx={thumb.x} cy={thumb.y} r="6"
              fill={color}
              stroke="#0a0a0a"
              strokeWidth="2"
            />
          )}

          {/* Center: value */}
          <text x="60" y="54" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="monospace">
            {display !== null ? display : '—'}
          </text>
          <text x="60" y="67" textAnchor="middle" fill="#71717a" fontSize="8">
            {display !== null ? 'horas' : 'toca para editar'}
          </text>
          <text x="60" y="78" textAnchor="middle" fontSize="7.5" fontWeight="600"
            fill={display !== null ? color : '#3f3f46'}>
            {getSleepLabel(display)}
          </text>
        </svg>
      </div>

      {/* Quick presets */}
      <div className="flex justify-between mt-1 gap-1">
        {[5, 6, 7, 8, 9].map(h => (
          <button
            key={h}
            onClick={() => { setLocalVal(h); onChange(h) }}
            className={clsx(
              'flex-1 text-[11px] font-mono py-1 rounded-lg transition-colors',
              display === h ? 'text-black font-bold' : 'text-zinc-600 hover:text-zinc-300 hover:bg-surface-2'
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
