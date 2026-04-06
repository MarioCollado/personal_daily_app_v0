'use client'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { deleteSet } from '@/lib/db'
import { setRow } from '@/styles/components'
import type { Set } from '@/types'

interface Props {
  set:      Set
  index:    number
  onDelete: () => void
}

function formatDuration(s: number | null): string {
  if (!s) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function calcPace(durationSec: number | null, distKm: number | null): string {
  if (!durationSec || !distKm || distKm <= 0) return '—'
  const paceSecPerKm = durationSec / distKm
  const m = Math.floor(paceSecPerKm / 60)
  const s = Math.round(paceSecPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CardioSetRow({ set, index, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteSet(set.id)
    onDelete()
  }

  const pace = calcPace(set.duration_seconds, set.distance_km)

  return (
    <div className={clsx(setRow.grid, 'grid-cols-4', deleting && 'opacity-50')}>
      <span className={setRow.index}>#{index}</span>
      <span className={setRow.value}>
        {set.distance_km != null ? set.distance_km.toFixed(1) : '—'}
        <span className={setRow.muted}>km</span>
      </span>
      <span className={setRow.value}>{formatDuration(set.duration_seconds)}</span>
      <div className="flex items-center justify-between">
        <span className="text-sky-400 font-mono text-xs">{pace}</span>
        <button onClick={handleDelete} disabled={deleting} className={setRow.deleteBtn}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
