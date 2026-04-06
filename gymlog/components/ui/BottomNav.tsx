'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Dumbbell, Clock, ChefHat } from 'lucide-react'
import { clsx } from 'clsx'
import { nav } from '@/styles/components'

const TABS = [
  { href: '/dashboard', label: 'Hoy',      Icon: LayoutDashboard },
  { href: '/today',     label: 'Entreno',  Icon: Dumbbell        },
  { href: '/history',   label: 'Historial', Icon: Clock          },
  { href: '/recipes',   label: 'Recetas',  Icon: ChefHat         },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-1/95 backdrop-blur-md border-t border-surface-border pb-safe z-40">
      <div className="flex justify-around w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={clsx(nav.tab, active ? nav.tabActive : nav.tabInactive)}>
              <Icon className={clsx('w-5 h-5', active && nav.iconActive)} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
