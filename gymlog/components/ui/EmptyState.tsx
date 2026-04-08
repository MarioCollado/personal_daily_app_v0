'use client'

import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-surface-border flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="font-bold text-main text-lg">{title}</h2>
      <p className="text-muted text-sm mt-1 max-w-xs">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
