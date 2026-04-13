'use client'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Set } from '@/types'
import { deleteSet } from '@/lib/db'
import { clsx } from 'clsx'

interface Props {
  set: Set
  index: number
  onDelete: () => void
}

export default function SetRow({ set, index, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteSet(set.id)
    onDelete()
  }

  return (
    <div className={clsx('grid grid-cols-4 gap-2 items-center text-sm py-1.5 px-1 rounded-lg hover:bg-surface-2 group transition-colors', deleting && 'opacity-50')}>
      <span className="text-muted font-mono">{index}</span>
      <span className="font-mono font-medium text-main">{set.weight}<span className="text-muted text-xs">kg</span></span>
      <span className="font-mono font-medium text-main">{set.reps}<span className="text-muted text-xs">reps</span></span>
      <div className="flex items-center justify-between">
        <span className="text-muted font-mono text-xs">{set.rir != null ? `${set.rir} RIR` : '—'}</span>
        <button onClick={handleDelete} disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-400 p-1 -mr-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
