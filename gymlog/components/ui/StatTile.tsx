'use client'

import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type StatTileProps = {
  value: ReactNode
  label: string
  valueClassName?: string
}

export default function StatTile({ value, label, valueClassName }: StatTileProps) {
  return (
    <div className="card p-3 text-center">
      <div className={clsx('text-xl font-bold font-mono text-main', valueClassName)}>{value}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  )
}
