'use client'
import Link from 'next/link'
import { Palette, ChevronRight, Lock, Eye, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { useLongPress } from '@/hooks/useLongPress'
import { useI18n } from '@/contexts/I18nContext'
import type { TodayArtsSummary, ArtDiscipline } from '@/types'

interface Props {
  summary: TodayArtsSummary | null
  isLocked?: boolean
  onToggleLock?: () => void
}

const DISC_EMOJI: Partial<Record<ArtDiscipline, string>> = {
  music: '🎵', film: '🎬', book: '📖', painting: '🎨',
  photography: '📷', theater: '🎭', dance: '💃', design: '✏️',
  writing: '🖊️', other: '🌀',
}

function fmt(min: number) {
  if (!min) return null
  if (min < 60) return `${min}′`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h ${m}′` : `${h}h`
}

export default function ArtsBlock({ summary, isLocked, onToggleLock }: Props) {
  const { t } = useI18n()
  const longPress = useLongPress({ onLongPress: () => onToggleLock?.() })

  const hasSessions = (summary?.sessions?.length ?? 0) > 0
  const obsMin  = summary?.totalObservationMinutes ?? 0
  const practMin = summary?.totalPracticeMinutes ?? 0
  const total   = obsMin + practMin
  const obsPct  = total > 0 ? Math.round((obsMin / total) * 100) : 0
  const hasSynergy = obsMin > 0 && practMin > 0

  return (
    <div
      className="bento-card flex flex-col h-full relative overflow-hidden select-none [-webkit-touch-callout:none]"
      {...longPress}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-surface-1/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center mb-2 ring-1 ring-violet-500/30">
            <Lock className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-violet-400 font-semibold text-xs">{t('dashboard.arts_block.locked')}</span>
          <span className="text-muted text-[10px] mt-0.5 text-center">{t('dashboard.arts_block.locked_desc')}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-violet-400" />
          <span className="text-[11px] lg:text-xs font-bold text-muted uppercase tracking-widest">
            {t('dashboard.arts_block.title')}
          </span>
        </div>
        {hasSessions && (
          <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-violet-500 animate-pulse-dot" />
        )}
      </div>

      {!hasSessions ? (
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-2 lg:py-4">
          <div className="text-3xl lg:text-4xl opacity-40">🎨</div>
          <p className="text-[11px] lg:text-xs text-muted text-center leading-relaxed px-1">
            {t('dashboard.arts_block.no_session')}
          </p>
          <Link
            href="/arts"
            className="flex items-center gap-1.5 text-xs lg:text-sm font-semibold text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl transition-all duration-200 group"
          >
            <Plus className="w-3 h-3 lg:w-3.5 lg:h-3.5 group-hover:rotate-90 transition-transform duration-300" />
            {t('dashboard.arts_block.start')}
          </Link>
        </div>
      ) : (
        <>
          {/* Featured item */}
          {summary?.featuredItem && (
            <div className="flex items-center gap-2 mb-3 lg:mb-4 bg-surface-2/60 rounded-xl px-2.5 lg:px-3 py-2 lg:py-2.5 border border-surface-border/40">
              <span className="text-base lg:text-lg flex-shrink-0 leading-none">
                {DISC_EMOJI[summary.featuredItem.discipline] ?? '🌀'}
              </span>
              <span className="text-xs lg:text-sm font-bold text-main truncate flex-1">
                {summary.featuredItem.title}
              </span>
            </div>
          )}

          {/* Stat tiles */}
          <div className="flex gap-2 mb-3 lg:mb-4">
            {obsMin > 0 && (
              <div className="flex-1 rounded-xl p-2 lg:p-3 text-center bg-sky-500/8 border border-sky-500/20">
                <Eye className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-sky-400 mx-auto mb-1" />
                <div className="text-base lg:text-lg font-mono font-bold text-sky-400 leading-none">{fmt(obsMin)}</div>
                <div className="text-[9px] lg:text-[10px] text-sky-400/60 font-bold uppercase tracking-tighter mt-0.5">
                  {t('dashboard.arts_block.observe')}
                </div>
              </div>
            )}
            {practMin > 0 && (
              <div className="flex-1 rounded-xl p-2 lg:p-3 text-center bg-violet-500/8 border border-violet-500/20">
                <Palette className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-violet-400 mx-auto mb-1" />
                <div className="text-base lg:text-lg font-mono font-bold text-violet-400 leading-none">{fmt(practMin)}</div>
                <div className="text-[9px] lg:text-[10px] text-violet-400/60 font-bold uppercase tracking-tighter mt-0.5">
                  {t('dashboard.arts_block.practice')}
                </div>
              </div>
            )}
          </div>

          {/* Dual-axis bar */}
          {hasSynergy && (
            <div className="mb-3 lg:mb-4">
              <div className="h-1.5 lg:h-2 rounded-full overflow-hidden flex gap-px bg-surface-3">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${obsPct}%` }}
                />
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${100 - obsPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 lg:mt-1.5">
                <span className="text-[9px] lg:text-[10px] text-sky-400/70 font-bold uppercase tracking-tight">
                  {t('dashboard.arts_block.observe')} {obsPct}%
                </span>
                <span className="text-[9px] lg:text-[10px] text-violet-400/70 font-bold uppercase tracking-tight">
                  {100 - obsPct}% {t('dashboard.arts_block.practice')}
                </span>
              </div>
            </div>
          )}

          {/* Synergy badge */}
          {hasSynergy && (
            <div className="mb-3 lg:mb-4 flex items-center justify-center gap-1.5 py-1 lg:py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <span className="text-[11px] lg:text-xs">✦</span>
              <span className="text-[10px] lg:text-xs font-bold text-violet-400">
                {t('dashboard.arts_block.synergy')}
              </span>
            </div>
          )}

          {/* Session list */}
          <div className="space-y-1 flex-1 overflow-hidden mb-3">
            {summary!.sessions.slice(0, 2).map(s => (
              <div key={s.id} className="flex items-center gap-2 text-xs py-0.5">
                <span className="text-sm flex-shrink-0 leading-none opacity-80">
                  {DISC_EMOJI[s.art_item?.discipline ?? 'other'] ?? '🌀'}
                </span>
                <span className="text-main truncate flex-1 font-medium">
                  {s.art_item?.title ?? t('dashboard.arts_block.session')}
                </span>
                {s.session_type && (
                  <span className="text-[10px] text-muted flex-shrink-0 bg-surface-2 px-1.5 py-0.5 rounded-md">
                    {s.session_type}
                  </span>
                )}
              </div>
            ))}
            {summary!.sessions.length > 2 && (
              <p className="text-[10px] text-muted/50 pl-1">
                {t('dashboard.arts_block.more_count', { count: summary!.sessions.length - 2 })}
              </p>
            )}
          </div>

          {/* CTA */}
          <Link
            href="/arts"
            className="flex items-center justify-between bg-violet-500/10 hover:bg-violet-500/18 border border-violet-500/20 rounded-xl px-3 py-2 transition-all duration-200 group"
          >
            <span className="text-xs font-semibold text-violet-400">
              {t('dashboard.arts_block.continue')}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-violet-500 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </>
      )}
    </div>
  )
}
