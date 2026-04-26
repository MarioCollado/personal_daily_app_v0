'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Palette, Plus, Lock, Eye, Music, Film,
  BookOpen, Camera, Brush, Clock, Save, ChevronLeft,
  ChevronDown, ChevronRight, Check, Trash2
} from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase-client'
import {
  getArtItems, createArtItem, updateArtItem,
  getTodayArtsSummary, createOrUpdateArtSession, deleteArtSession,
  getRecentArtSessions, upsertArtDailyState, getArtItemProgress
} from '@/lib/arts'
import type { ArtItem, ArtSession, TodayArtsSummary, ArtDiscipline, ArtSessionWithItem } from '@/types'
import BottomNav from '@/components/ui/BottomNav'
import PageHeader from '@/components/ui/PageHeader'
import PageLoader from '@/components/ui/PageLoader'
import { useLongPress } from '@/hooks/useLongPress'
import { useI18n } from '@/contexts/I18nContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function getLocalISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DISC_EMOJI: Record<ArtDiscipline, string> = {
  music: '🎵', film: '🎬', book: '📖', painting: '🎨',
  photography: '📷', theater: '🎭', dance: '💃', design: '✏️',
  writing: '🖊️', other: '🌀',
}

const DISCIPLINES: { value: ArtDiscipline; label_es: string; label_en: string }[] = [
  { value: 'music',       label_es: 'Música',       label_en: 'Music'       },
  { value: 'film',        label_es: 'Cine',         label_en: 'Film'        },
  { value: 'book',        label_es: 'Libro',        label_en: 'Book'        },
  { value: 'painting',    label_es: 'Pintura',      label_en: 'Painting'    },
  { value: 'photography', label_es: 'Fotografía',   label_en: 'Photography' },
  { value: 'theater',     label_es: 'Teatro',       label_en: 'Theater'     },
  { value: 'dance',       label_es: 'Danza',        label_en: 'Dance'       },
  { value: 'design',      label_es: 'Diseño',       label_en: 'Design'      },
  { value: 'writing',     label_es: 'Escritura',    label_en: 'Writing'     },
  { value: 'other',       label_es: 'Otro',         label_en: 'Other'       },
]

function minutesLabel(min: number) {
  if (!min) return '—'
  if (min < 60) return `${min}′`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}′` : `${h}h`
}

function DateLabel({ date, t }: { date: string; t: (k: string, p?: Record<string, string | number>) => string }) {
  const today = getLocalISODate()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (date === today) return <span className="text-[10px] text-brand-400 font-bold uppercase">{t('common.today')}</span>
  if (date === yesterday) return <span className="text-[10px] text-muted font-bold uppercase">{t('common.yesterday')}</span>
  return <span className="text-[10px] text-muted">{date}</span>
}

// ─── Session Form ─────────────────────────────────────────────

interface SessionFormState {
  art_item_id: string
  observation_minutes: string
  observation_units: string
  practice_minutes: string
  practice_units: string
  session_type: string
  effort: number
  notes: string
}

const EMPTY_FORM: SessionFormState = {
  art_item_id: '',
  observation_minutes: '',
  observation_units: '',
  practice_minutes: '',
  practice_units: '',
  session_type: '',
  effort: 0,
  notes: '',
}

// ─── Main Page ────────────────────────────────────────────────

export default function ArtsPage() {
  const { t, language } = useI18n()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [currentDate] = useState(getLocalISODate)
  const [summary, setSummary] = useState<TodayArtsSummary | null>(null)
  const [artItems, setArtItems] = useState<ArtItem[]>([])
  const [recentSessions, setRecentSessions] = useState<ArtSessionWithItem[]>([])
  const [showRecentHistory, setShowRecentHistory] = useState(false)
  const [showMyItems, setShowMyItems] = useState(false)

  // Form state
  const [form, setForm] = useState<SessionFormState>(EMPTY_FORM)
  const [selectedDiscipline, setSelectedDiscipline] = useState<ArtDiscipline>('music')
  const [showNewItem, setShowNewItem] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemTotalUnits, setNewItemTotalUnits] = useState('')
  const [creatingItem, setCreatingItem] = useState(false)
  const [itemProgress, setItemProgress] = useState<number | null>(null)

  const isLocked = summary?.dailyState?.arts_locked ?? false
  
  const selectedItemObj = artItems.find(i => i.id === form.art_item_id)
  const isItemSelectedCompleted = selectedItemObj?.status === 'completed'

  const longPress = useLongPress({
    onLongPress: async () => {
      if (!userId) return
      await upsertArtDailyState(userId, currentDate, { arts_locked: !isLocked })
      setSummary(prev => prev ? {
        ...prev,
        dailyState: { ...(prev.dailyState ?? { user_id: userId, date: currentDate, featured_art_item_id: null }), arts_locked: !isLocked }
      } : prev)
    }
  })

  const initialLoadDone = useRef(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    const [sum, items, recent] = await Promise.all([
      getTodayArtsSummary(user.id, currentDate),
      getArtItems(user.id),
      getRecentArtSessions(user.id, 14),
    ])

    setSummary(sum)
    setArtItems(items)
    setRecentSessions(recent)

    if (!initialLoadDone.current && items.length > 0) {
      setForm(f => ({ ...f, art_item_id: items[0].id }))
      setSelectedDiscipline(items[0].discipline)
      initialLoadDone.current = true
    }

    setLoading(false)
  }, [currentDate, router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    async function loadProgress() {
      if (!userId || !form.art_item_id) {
        setItemProgress(null)
        return
      }
      const item = artItems.find(i => i.id === form.art_item_id)
      if (item?.discipline === 'book' && item.total_units) {
        const prog = await getArtItemProgress(userId, form.art_item_id)
        setItemProgress(prog)
      } else {
        setItemProgress(null)
      }
    }
    loadProgress()
  }, [userId, form.art_item_id, artItems, summary])

  const filteredItems = artItems.filter(i => i.discipline === selectedDiscipline)

  function handleDisciplineSelect(d: ArtDiscipline) {
    setSelectedDiscipline(d)
    const firstActive = artItems.find(i => i.discipline === d && i.status !== 'completed')
    setForm(f => ({ ...f, art_item_id: firstActive?.id ?? '' }))
    setShowNewItem(false)
  }

  function handleSelectFromMyItems(item: ArtItem) {
    setSelectedDiscipline(item.discipline)
    setForm(f => ({ ...f, art_item_id: item.id }))
    setShowNewItem(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleCreateItem() {
    if (!userId || !newItemTitle.trim()) return
    setCreatingItem(true)
    try {
      const item = await createArtItem(userId, {
        discipline: selectedDiscipline,
        title: newItemTitle.trim(),
        creator_name: null,
        format: null,
        total_units: selectedDiscipline === 'book' && newItemTotalUnits ? Number(newItemTotalUnits) : null,
        unit_label: selectedDiscipline === 'book' ? 'pages' : null,
        status: 'active',
        started_on: null,
        completed_on: null,
        notes: null,
      })
      setArtItems(prev => [item, ...prev])
      setForm(f => ({ ...f, art_item_id: item.id }))
      setShowNewItem(false)
      setNewItemTitle('')
      setNewItemTotalUnits('')
    } finally {
      setCreatingItem(false)
    }
  }

  async function handleCompleteItem(itemId: string) {
    if (!userId) return
    try {
      const updated = await updateArtItem(userId, itemId, { 
        status: 'completed',
        completed_on: new Date().toISOString()
      })
      setArtItems(prev => prev.map(i => i.id === itemId ? updated : i))
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!userId || !confirm(language === 'es' ? '¿Borrar esta sesión?' : 'Delete this session?')) return
    try {
      await deleteArtSession(userId, sessionId)
      setRecentSessions(prev => prev.filter(s => s.id !== sessionId))
      // Also update today's summary if the session was from today
      const sum = await getTodayArtsSummary(userId, currentDate)
      setSummary(sum)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSaveSession() {
    if (!userId) return
    const hasContent =
      (form.observation_minutes && Number(form.observation_minutes) > 0) ||
      (form.observation_units   && Number(form.observation_units)   > 0) ||
      (form.practice_minutes    && Number(form.practice_minutes)    > 0) ||
      (form.practice_units      && Number(form.practice_units)      > 0)

    if (!hasContent) return

    setSaving(true)
    try {
      await createOrUpdateArtSession(userId, {
        art_item_id: form.art_item_id || null,
        date: currentDate,
        observation_minutes: form.observation_minutes ? Number(form.observation_minutes) : null,
        observation_units:   form.observation_units   ? Number(form.observation_units)   : null,
        practice_minutes:    form.practice_minutes    ? Number(form.practice_minutes)    : null,
        practice_units:      form.practice_units      ? Number(form.practice_units)      : null,
        session_type: form.session_type || null,
        effort:       form.effort > 0  ? form.effort : null,
        public_output:  false,
        collaborative:  false,
        notes: form.notes || null,
      })
      setForm(EMPTY_FORM)
      const [newSummary, recent] = await Promise.all([
        getTodayArtsSummary(userId, currentDate),
        getRecentArtSessions(userId, 14),
      ])
      setSummary(newSummary)
      setRecentSessions(recent)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  const disc = DISCIPLINES.find(d => d.value === selectedDiscipline)
  const discLabel = language === 'es' ? disc?.label_es : disc?.label_en

  return (
    <div className="min-h-screen bg-surface-0 pb-24">
      <PageHeader innerClassName="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link href="/dashboard" className="text-muted hover:text-main p-1.5 rounded-lg hover:bg-surface-2 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-violet-400" />
          <span className="font-bold text-sm tracking-widest text-main">{t('arts.title')}</span>
        </div>
        <div className="w-8" />
      </PageHeader>

      <main className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-2 pb-6 space-y-5">

        {/* ── Today Summary Bento ── */}
        {summary && (summary.totalObservationMinutes > 0 || summary.totalPracticeMinutes > 0) && (
          <div className="bento-card overflow-hidden relative" {...longPress}>
            {isLocked && (
              <div className="absolute inset-0 z-20 bg-surface-1/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center mb-2 ring-1 ring-violet-500/30">
                  <Lock className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-violet-400 font-semibold text-xs">{t('arts.locked')}</span>
                <span className="text-muted text-[10px] mt-0.5 text-center">{t('arts.locked_desc')}</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{t('arts.today_summary')}</span>
              {summary.totalObservationMinutes > 0 && summary.totalPracticeMinutes > 0 && (
                 <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                   <span className="text-[11px]">✦</span>
                   <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">{t('arts.synergy')}</span>
                 </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {summary.totalObservationMinutes > 0 && (
                <div className="bg-sky-500/5 rounded-xl p-3 border border-sky-500/10">
                  <Eye className="w-4 h-4 text-sky-400 mb-2" />
                  <div className="text-2xl font-mono font-bold text-sky-400 leading-none mb-1">{minutesLabel(summary.totalObservationMinutes)}</div>
                  <div className="text-[10px] text-sky-400/70 font-bold uppercase tracking-widest">{t('arts.observe')}</div>
                </div>
              )}
              {summary.totalPracticeMinutes > 0 && (
                <div className="bg-violet-500/5 rounded-xl p-3 border border-violet-500/10">
                  <Palette className="w-4 h-4 text-violet-400 mb-2" />
                  <div className="text-2xl font-mono font-bold text-violet-400 leading-none mb-1">{minutesLabel(summary.totalPracticeMinutes)}</div>
                  <div className="text-[10px] text-violet-400/70 font-bold uppercase tracking-widest">{t('arts.practice')}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Log Session Form ── */}
        {!isLocked && (
          <div className="bento-card">
            {/* Discipline Scroller */}
            <div className="mb-5 -mx-4 px-4 overflow-x-auto no-scrollbar">
              <div className="flex gap-2 min-w-max pb-2">
                {DISCIPLINES.map(d => (
                  <button
                    key={d.value}
                    onClick={() => handleDisciplineSelect(d.value)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200',
                      selectedDiscipline === d.value
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25 scale-105'
                        : 'bg-surface-2 text-muted border border-surface-border hover:bg-surface-3'
                    )}
                  >
                    <span className="text-sm">{DISC_EMOJI[d.value]}</span>
                    <span>{language === 'es' ? d.label_es : d.label_en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Item Selection */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">{t('arts.item')}</label>
                {filteredItems.length > 0 && !showNewItem && (
                   <button onClick={() => setShowNewItem(true)} className="text-[10px] text-violet-400 font-bold uppercase hover:underline">
                     + {t('arts.new_item')}
                   </button>
                )}
              </div>
              
              {showNewItem || filteredItems.length === 0 ? (
                <div className="flex flex-col gap-2">
                  {filteredItems.length === 0 && (
                    <p className="text-[10px] text-muted italic mb-1">
                      {language === 'es' ? 'No tienes obras en esta disciplina. Añade una nueva:' : 'No works in this discipline. Add a new one:'}
                    </p>
                  )}
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      value={newItemTitle}
                      onChange={e => setNewItemTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateItem()}
                      placeholder={t('arts.item_placeholder')}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-4 py-3 text-sm text-main placeholder-muted focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
                    />
                  </div>
                  {selectedDiscipline === 'book' && (
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={newItemTotalUnits}
                        onChange={e => setNewItemTotalUnits(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateItem()}
                        placeholder={language === 'es' ? 'Total de páginas...' : 'Total pages...'}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-4 py-3 text-sm text-main placeholder-muted focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateItem}
                      disabled={creatingItem || !newItemTitle.trim()}
                      className="flex-1 btn-primary text-xs py-2 disabled:opacity-50"
                    >
                      {creatingItem ? '...' : t('common.save')}
                    </button>
                    {filteredItems.length > 0 && (
                      <button
                        onClick={() => setShowNewItem(false)}
                        className="flex-1 bg-surface-2 text-muted text-xs font-semibold py-2 rounded-xl hover:bg-surface-3 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                     <select 
                       value={form.art_item_id}
                       onChange={e => setForm(f => ({ ...f, art_item_id: e.target.value }))}
                       className="w-full appearance-none bg-surface-2 border border-surface-border rounded-xl px-4 py-3 text-sm font-medium text-main focus:outline-none focus:border-violet-500 transition-all pr-10 cursor-pointer"
                     >
                       {filteredItems.map(item => (
                         <option key={item.id} value={item.id}>
                           {item.title} {item.status === 'completed' ? '(Completado)' : ''}
                         </option>
                       ))}
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  </div>
                  {selectedDiscipline === 'book' && itemProgress !== null && (
                    <div className="px-1 mt-1">
                      {(() => {
                        const item = artItems.find(i => i.id === form.art_item_id)
                        const total = item?.total_units || 1
                        const progress = Math.min((itemProgress / total) * 100, 100)
                        return (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted">
                              <span>Progreso</span>
                              <span>{itemProgress} / {item?.total_units} pág.</span>
                            </div>
                            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-violet-500 transition-all duration-500" 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Overlay Wrapper */}
            <div className="relative">
              {isItemSelectedCompleted && (
                <div className="absolute inset-0 z-10 bg-surface-0/60 backdrop-blur-sm rounded-xl flex items-center justify-center pointer-events-auto">
                  <div className="bg-surface-1/80 border border-surface-border px-4 py-3 rounded-2xl flex flex-col items-center shadow-xl mb-6">
                    <Check className="w-5 h-5 text-brand-400 mb-1" />
                    <span className="text-xs font-bold text-main">{language === 'es' ? 'Obra Finalizada' : 'Work Completed'}</span>
                    <span className="text-[10px] text-muted text-center max-w-[160px] mt-0.5">
                      {language === 'es' ? 'Selecciona otra obra para registrar sesiones.' : 'Select another work to log sessions.'}
                    </span>
                  </div>
                </div>
              )}
              
              <div className={clsx(isItemSelectedCompleted && "pointer-events-none opacity-40 select-none transition-all")}>
                {/* Dual Axis Input Area */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Observe */}
              <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">{t('arts.observe')}</span>
                </div>
                <div>
                  <input
                    type="number" min={0} placeholder="0"
                    value={form.observation_minutes}
                    onChange={e => setForm(f => ({ ...f, observation_minutes: e.target.value }))}
                    className="w-full bg-surface-0 border border-surface-border rounded-lg px-3 py-2 text-sm font-mono text-main placeholder-muted focus:outline-none focus:border-sky-400 transition-all"
                  />
                  <div className="text-[9px] text-muted font-semibold uppercase tracking-tighter mt-1">{t('arts.minutes')}</div>
                </div>
                <div>
                  <input
                    type="number" min={0} placeholder="0"
                    value={form.observation_units}
                    onChange={e => setForm(f => ({ ...f, observation_units: e.target.value }))}
                    className="w-full bg-surface-0 border border-surface-border rounded-lg px-3 py-2 text-sm font-mono text-main placeholder-muted focus:outline-none focus:border-sky-400 transition-all"
                  />
                  <div className="text-[9px] text-muted font-semibold uppercase tracking-tighter mt-1">{t('arts.units')}</div>
                </div>
              </div>

              {/* Practice */}
              <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">{t('arts.practice')}</span>
                </div>
                <div>
                  <input
                    type="number" min={0} placeholder="0"
                    value={form.practice_minutes}
                    onChange={e => setForm(f => ({ ...f, practice_minutes: e.target.value }))}
                    className="w-full bg-surface-0 border border-surface-border rounded-lg px-3 py-2 text-sm font-mono text-main placeholder-muted focus:outline-none focus:border-violet-400 transition-all"
                  />
                  <div className="text-[9px] text-muted font-semibold uppercase tracking-tighter mt-1">{t('arts.minutes')}</div>
                </div>
                <div>
                  <input
                    type="number" min={0} placeholder="0"
                    value={form.practice_units}
                    onChange={e => setForm(f => ({ ...f, practice_units: e.target.value }))}
                    className="w-full bg-surface-0 border border-surface-border rounded-lg px-3 py-2 text-sm font-mono text-main placeholder-muted focus:outline-none focus:border-violet-400 transition-all"
                  />
                  <div className="text-[9px] text-muted font-semibold uppercase tracking-tighter mt-1">{t('arts.units')}</div>
                </div>
              </div>
            </div>

            {/* Extra Details */}
            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1 block">{t('arts.session_type')}</label>
                  <input
                    type="text"
                    value={form.session_type}
                    onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))}
                    placeholder={t('arts.session_type_placeholder')}
                    className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-main placeholder-muted focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1 block">{t('arts.effort')} (1-5)</label>
                  <div className="flex gap-1 h-[34px]">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        onClick={() => setForm(f => ({ ...f, effort: f.effort === n ? 0 : n }))}
                        className={clsx(
                          'flex-1 rounded-lg text-xs font-bold transition-all',
                          form.effort >= n
                            ? 'bg-violet-500 text-white'
                            : 'bg-surface-2 text-muted hover:bg-surface-3 border border-surface-border'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1 block">{t('arts.notes')}</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder={t('arts.notes_placeholder')}
                      rows={2}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-main placeholder-muted focus:outline-none focus:border-violet-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveSession}
                  disabled={saving}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm font-bold disabled:opacity-50 shadow-lg shadow-brand-500/20"
                >
                  {saving
                    ? <><Clock className="w-4 h-4 animate-spin" />{t('common.loading')}</>
                    : <><Save className="w-4 h-4" />{t('arts.save_session')}</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Recent History ── */}
        {recentSessions.length > 0 && (
          <div className="space-y-3">
            <button 
              onClick={() => setShowRecentHistory(!showRecentHistory)}
              className="flex items-center justify-between w-full p-2 -ml-2 rounded-xl hover:bg-surface-2 transition-colors group touch-manipulation"
            >
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted pl-1 group-hover:text-main transition-colors">
                {t('arts.recent')}
              </h3>
              <ChevronRight className={clsx("w-4 h-4 text-muted transition-transform", showRecentHistory && "rotate-90")} />
            </button>
            
            {showRecentHistory && (
            <div className="bg-surface-1 border border-surface-border rounded-2xl overflow-hidden divide-y divide-surface-border/50 animate-slide-up">
              {recentSessions.slice(0, 10).map(s => (
                <div key={s.id} className="p-3.5 hover:bg-surface-2 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl leading-none">{DISC_EMOJI[s.art_item?.discipline ?? 'other']}</span>
                      <span className="text-sm font-bold text-main truncate">
                        {s.art_item?.title ?? t('arts.session')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DateLabel date={s.date} t={t} />
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="text-muted hover:text-red-400 p-1 rounded-md hover:bg-red-400/10 transition-colors"
                        title="Borrar sesión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-7">
                    {(s.observation_minutes ?? 0) > 0 && (
                      <div className="flex items-center gap-1 bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium">
                        <Eye className="w-3 h-3" />
                        {minutesLabel(s.observation_minutes!)}
                      </div>
                    )}
                    {(s.practice_minutes ?? 0) > 0 && (
                      <div className="flex items-center gap-1 bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium">
                        <Palette className="w-3 h-3" />
                        {minutesLabel(s.practice_minutes!)}
                      </div>
                    )}
                    {s.session_type && (
                      <span className="text-[10px] text-muted border border-surface-border px-1.5 py-0.5 rounded-md">
                        {s.session_type}
                      </span>
                    )}
                    {s.effort && (
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <div key={n} className={clsx('w-1.5 h-1.5 rounded-full', s.effort! >= n ? 'bg-violet-400' : 'bg-surface-border')} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ── My Items ── */}
        {artItems.length > 0 && (
          <div className="space-y-3">
            <button 
              onClick={() => setShowMyItems(!showMyItems)}
              className="flex items-center justify-between w-full p-2 -ml-2 rounded-xl hover:bg-surface-2 transition-colors group touch-manipulation"
            >
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted pl-1 group-hover:text-main transition-colors">
                {t('arts.my_items')}
              </h3>
              <ChevronRight className={clsx("w-4 h-4 text-muted transition-transform", showMyItems && "rotate-90")} />
            </button>

            {showMyItems && (
            <div className="bg-surface-1 border border-surface-border rounded-2xl overflow-hidden divide-y divide-surface-border/50 animate-slide-up">
              {artItems.slice(0, 8).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3.5 hover:bg-surface-2 transition-colors group">
                  <button 
                    onClick={() => handleSelectFromMyItems(item)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <span className="text-xl leading-none">{DISC_EMOJI[item.discipline] ?? '🌀'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-main truncate group-hover:text-violet-400 transition-colors">{item.title}</p>
                      {item.creator_name && (
                        <p className="text-[10px] text-muted truncate">{item.creator_name}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={clsx(
                      'text-[9px] font-bold uppercase px-2 py-1 rounded-md border',
                      item.status === 'active'    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                      item.status === 'completed' ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' :
                                                    'bg-surface-2 text-muted border-surface-border'
                    )}>
                      {t(`arts.status.${item.status}`)}
                    </span>
                    {item.status === 'active' && (
                      <button
                        onClick={() => handleCompleteItem(item.id)}
                        title="Finalizar obra"
                        className="p-1 rounded-md bg-surface-2 hover:bg-brand-500/20 text-muted hover:text-brand-400 transition-colors border border-transparent hover:border-brand-500/30"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

      </main>
      <BottomNav />
    </div>
  )
}
