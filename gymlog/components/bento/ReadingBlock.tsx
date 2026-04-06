'use client'
import { useState } from 'react'
import { BookOpen, Plus, Minus, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  bookTitle: string | null
  pagesRead: number | null
  bookTotalPages: number | null
  bookSuggestions: string[]
  onChange: (updates: { book_title?: string; pages_read?: number; book_total_pages?: number }) => void
  saving?: boolean
}

export default function ReadingBlock({ bookTitle, pagesRead, bookTotalPages, bookSuggestions, onChange, saving }: Props) {
  const [editingBook, setEditingBook] = useState(false)
  const [bookInput, setBookInput] = useState(bookTitle || '')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const progress = bookTitle && pagesRead && bookTotalPages
    ? Math.min(100, Math.round((pagesRead / bookTotalPages) * 100))
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
    bookInput.length > 0 && s.toLowerCase().includes(bookInput.toLowerCase())
  )

  return (
    <div className="bento-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Lectura</span>
        </div>
        {saving && <span className="text-[10px] text-zinc-600 animate-pulse-dot">guardando</span>}
      </div>

      {/* Book title */}
      <div className="mb-3 relative">
        {editingBook ? (
          <>
            <input
              autoFocus
              type="text"
              value={bookInput}
              onChange={e => { setBookInput(e.target.value); setShowSuggestions(true) }}
              onBlur={() => setTimeout(commitBook, 150)}
              onKeyDown={e => e.key === 'Enter' && commitBook()}
              placeholder="Título del libro..."
              className="w-full bg-surface-2 border border-surface-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
            />
            {showSuggestions && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-0.5 bg-surface-2 border border-surface-border rounded-lg overflow-hidden z-10 shadow-xl">
                {filtered.slice(0, 4).map(s => (
                  <button key={s} onMouseDown={() => { setBookInput(s); onChange({ book_title: s }); setEditingBook(false); setShowSuggestions(false) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-3 transition-colors border-b border-surface-border last:border-0 truncate">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <button onClick={() => { setEditingBook(true); setBookInput(bookTitle || '') }}
            className={clsx('w-full text-left text-xs rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2 group flex items-center justify-between gap-1',
              bookTitle ? 'text-white font-medium' : 'text-zinc-600')}>
            <span className="truncate">{bookTitle || 'Añadir libro...'}</span>
            <ChevronDown className="w-3 h-3 text-zinc-700 flex-shrink-0 opacity-0 group-hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Pages counter */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => addPages(-5)} className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-zinc-400 hover:text-white transition-colors touch-manipulation">
          <Minus className="w-3 h-3" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-mono font-bold">{pagesRead ?? 0}</span>
          <span className="text-xs text-zinc-600 ml-1">pág. hoy</span>
        </div>
        <button onClick={() => addPages(5)} className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-zinc-400 hover:text-white transition-colors touch-manipulation">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Quick +page buttons */}
      <div className="flex gap-1 mb-3">
        {[1, 10, 25, 50].map(n => (
          <button key={n} onClick={() => addPages(n)}
            className="flex-1 text-[11px] font-mono py-1 rounded-lg bg-surface-2 hover:bg-violet-500/20 hover:text-violet-300 text-zinc-500 transition-colors touch-manipulation">
            +{n}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {bookTitle && bookTotalPages && (
        <div>
          <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
            <span>{pagesRead ?? 0} / {bookTotalPages} pág.</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Set total pages */}
      {bookTitle && !bookTotalPages && (
        <button
          onClick={() => {
            const total = prompt('Total de páginas del libro:')
            if (total && !isNaN(Number(total))) onChange({ book_total_pages: Number(total) })
          }}
          className="text-[10px] text-zinc-700 hover:text-violet-400 transition-colors text-left">
          + añadir total páginas
        </button>
      )}
    </div>
  )
}
