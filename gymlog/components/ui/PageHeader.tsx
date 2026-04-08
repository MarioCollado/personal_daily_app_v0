'use client'

import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useScrollY } from '@/hooks/useScrollY'

type PageHeaderProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
}

export default function PageHeader({ children, className, innerClassName }: PageHeaderProps) {
  const scrollY = useScrollY()
  const isScrolled = scrollY > 0

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 pt-safe bg-surface-0/90 backdrop-blur-md transition-shadow duration-300',
        isScrolled
          ? 'border-b border-white/5 shadow-[0_8px_28px_rgba(0,0,0,0.34)]'
          : 'border-b border-transparent shadow-none',
        className
      )}
    >
      <div className="relative">
        <div className={clsx('max-w-lg mx-auto px-4 py-3', innerClassName)}>
          {children}
        </div>

        <div
          aria-hidden="true"
          className={clsx(
            'pointer-events-none absolute left-0 right-0 top-full h-8 bg-gradient-to-b from-black/22 via-black/8 to-transparent transition-opacity duration-300',
            isScrolled ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
    </header>
  )
}
