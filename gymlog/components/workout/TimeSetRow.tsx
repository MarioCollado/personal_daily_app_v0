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
  isLast?:  boolean
}

function formatDuration(s: number | null): string {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export default function TimeSetRow({ set, index, onDelete, isLast }: Props) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteSet(set.id)
    onDelete()
  }

  return (
    <div className={clsx(
      setRow.grid, 
      'grid-cols-[2rem_1fr_auto]', 
      deleting && 'opacity-50',
      isLast && 'bg-brand-500/5 animate-fade-in border-y border-brand-500/10'
    )}>
      <span className={clsx(setRow.index, isLast && 'text-brand-400')}>#{index}</span>
      <div className="flex items-center gap-2">
        <span className={clsx(
          "font-mono text-sm font-bold",
          isLast ? "text-brand-400" : "text-sky-400"
        )}>
          ⏱ {formatDuration(set.duration_seconds)}
        </span>
        <span className="text-[10px] text-muted uppercase font-bold tracking-tight">hold</span>
        {isLast && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-dot" />}
      </div>
      <button onClick={handleDelete} disabled={deleting} className={setRow.deleteBtn}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
