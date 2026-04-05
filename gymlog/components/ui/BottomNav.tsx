'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, Clock, BarChart2, User } from 'lucide-react'
import { clsx } from 'clsx'

const tabs = [
  { href: '/today',   label: 'Hoy',      Icon: Dumbbell },
  { href: '/history', label: 'Historial', Icon: Clock },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-1/95 backdrop-blur-md border-t border-surface-border pb-safe z-40">
      <div className="flex justify-around max-w-lg mx-auto">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={clsx('nav-tab flex-1', active ? 'text-brand-400' : 'text-zinc-500')}>
              <Icon className={clsx('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]')} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
