'use client'
import { useState } from 'react'
import { BookOpen, Plus, Minus, ChevronDown, Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { useLongPress } from '@/hooks/useLongPress'
import { useI18n } from '@/contexts/I18nContext'

interface Props {
  bookTitle: string | null
  pagesRead: number | null
  bookTotalPages: number | null
  accumulatedPages?: number | null
  bookSuggestions: string[]
  onChange: (updates: { book_title?: string; pages_read?: number; book_total_pages?: number }) => void
  saving?: boolean
  isLocked?: boolean
  onToggleLock?: () => void
}

export default function ReadingBlock({ bookTitle, pagesRead, bookTotalPages, accumulatedPages, bookSuggestions, onChange, saving, isLocked, onToggleLock }: Props) {
  const { t } = useI18n()
  const [editingBook, setEditingBook] = useState(false)
  const [bookInput, setBookInput] = useState(bookTitle || '')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const progress = (bookTitle && bookTotalPages)
    ? Math.min(100, Math.round(((accumulatedPages ?? pagesRead ?? 0) / bookTotalPages) * 100))
    : null

  function commitBook() {
    if (bookInput.trim()) onChange({ book_title: bookInput.trim() })
    setEditingBook(false)
    setShowSuggestions(false)
  }

  function addPages(delta: number) {
    const cur = pagesRead ?? 0
    const next = Math.max(0, cur + delta)
    onChange({ pages_read: next })
  }

  const filtered = bookSuggestions.filter(s =>
    bookInput.length === 0 || s.toLowerCase().includes(bookInput.toLowerCase())
  )

  const longPress = useLongPress({ onLongPress: () => onToggleLock?.() })

  return (
    <div className="bento-card flex flex-col h-full relative overflow-hidden select-none [-webkit-touch-callout:none]" {...longPress}>
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-surface-1/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 text-violet-400" />
          </div>
          <span className="text-violet-400 font-medium text-xs">{t('dashboard.reading_block.locked')}</span>
          <span className="text-muted text-[10px] mt-1 text-center font-medium">{t('dashboard.reading_block.locked_desc')}</span>
        </div>
      )}

      <div className="relative flex items-center justify-center mb-2 min-h-[20px]">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest">{t('dashboard.reading_block.title')}</span>
        </div>
        {saving && <span className="absolute right-0 text-[10px] text-muted animate-pulse-dot">{t('dashboard.reading_block.saving')}</span>}
      </div>

      <div className="mb-3 relative">
        {editingBook ? (
          <>
            <input
              autoFocus
              type="text"
              value={bookInput}
              onFocus={() => setShowSuggestions(true)}
              onChange={e => { setBookInput(e.target.value); setShowSuggestions(true) }}
              onBlur={() => setTimeout(commitBook, 150)}
              onKeyDown={e => e.key === 'Enter' && commitBook()}
              placeholder={t('dashboard.reading_block.input_placeholder')}
              className="w-full bg-surface-2 border border-surface-border rounded-lg px-2 py-1.5 text-xs text-main placeholder-muted focus:outline-none focus:border-violet-500"
            />
            {showSuggestions && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-0.5 bg-surface-2 border border-surface-border rounded-lg overflow-hidden z-10 shadow-xl">
                {filtered.slice(0, 4).map(s => (
                  <button key={s} onMouseDown={() => { setBookInput(s); onChange({ book_title: s }); setEditingBook(false); setShowSuggestions(false) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-3 text-main transition-colors border-b border-surface-border last:border-0 truncate">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <button onClick={() => { setEditingBook(true); setBookInput(bookTitle || '') }}
            className={clsx('w-full text-left text-xs rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-2 group flex items-center justify-between gap-1',
              bookTitle ? 'text-main font-bold' : 'text-muted border border-dashed border-surface-border')}>
            <span className="truncate">{bookTitle || t('dashboard.reading_block.placeholder')}</span>
            <ChevronDown className="w-3 h-3 text-muted flex-shrink-0 opacity-0 group-hover:opacity-100" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3 px-1">
        <button onClick={() => addPages(-5)} className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-muted hover:text-main transition-colors touch-manipulation">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-mono font-bold text-main leading-none">{pagesRead ?? 0}</span>
          <div className="text-[10px] text-muted font-bold uppercase tracking-tighter mt-1">{t('dashboard.reading_block.pages_today')}</div>
        </div>
        <button onClick={() => addPages(5)} className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-muted hover:text-main transition-colors touch-manipulation">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-1.5 mb-4">
        {[1, 10, 25, 50].map(n => (
          <button key={n} onClick={() => addPages(n)}
            className="flex-1 text-[11px] font-mono font-bold py-1.5 rounded-lg bg-surface-2 hover:bg-violet-500/20 hover:text-violet-400 text-muted transition-all duration-200 touch-manipulation">
            +{n}
          </button>
        ))}
      </div>

      {bookTitle && bookTotalPages && (
        <div className="px-1">
          <div className="flex justify-between text-[10px] font-bold text-muted mb-1.5 uppercase tracking-tighter">
            <span>{t('dashboard.reading_block.total_pages', { current: accumulatedPages ?? pagesRead ?? 0, total: bookTotalPages })}</span>
            <span>{progress ?? 0}%</span>
          </div>
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
              style={{ width: `${progress ?? 0}%` }} />
          </div>
        </div>
      )}

      {bookTitle && !bookTotalPages && (
        <button
          onClick={() => {
            const total = prompt(t('dashboard.reading_block.prompt_total'))
            if (total && !isNaN(Number(total))) onChange({ book_total_pages: Number(total) })
          }}
          className="text-[10px] font-bold uppercase tracking-tighter text-muted hover:text-violet-400 transition-colors text-center w-full mt-2">
          {t('dashboard.reading_block.add_total')}
        </button>
      )}
    </div>
  )
}
