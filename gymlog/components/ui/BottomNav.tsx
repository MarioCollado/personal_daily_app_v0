'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Dumbbell, Clock, ChefHat, Palette } from 'lucide-react'
import { clsx } from 'clsx'
import { useI18n } from '@/contexts/I18nContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const TABS = [
    { href: '/dashboard', label: t('nav.dashboard'), Icon: LayoutDashboard },
    { href: '/today',     label: t('nav.today'),     Icon: Dumbbell        },
    { href: '/arts',      label: t('nav.arts'),      Icon: Palette         },
    { href: '/recipes',   label: t('nav.recipes'),   Icon: ChefHat         },
  ]

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-0 via-surface-0/70 to-transparent pointer-events-none z-30" />
      <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav className="flex items-center gap-1 p-2 bg-surface-1/80 backdrop-blur-xl border border-surface-border rounded-2xl shadow-2xl shadow-black/20 pointer-events-auto max-w-fit mx-auto">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={clsx(
                'relative flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all duration-300 group',
                active ? 'text-brand' : 'text-muted hover:text-main hover:bg-surface-2/50'
              )}>
              <Icon className={clsx(
                'w-5 h-5 transition-transform duration-300',
                active ? 'scale-110' : 'group-hover:scale-105'
              )} />
              <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">{label}</span>
              
              {/* Active Indicator */}
              {active && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
    </>
  )
}
