'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { LogOut, RotateCcw, Sparkles, Bell, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getTodayWorkout, createWorkout, getExercisesForWorkout } from '@/lib/db'
import { getDailyMetrics, upsertDailyMetrics, getUserBooks } from '@/lib/metrics'
import type { Workout, Exercise, DailyMetrics } from '@/types'
import SleepBlock from '@/components/bento/SleepBlock'
import ClockWeatherBlock from '@/components/bento/ClockWeatherBlock'
import StateBlock from '@/components/bento/StateBlock'
import ReadingBlock from '@/components/bento/ReadingBlock'
import WorkoutBlock from '@/components/bento/WorkoutBlock'
import ScoreBlock from '@/components/bento/ScoreBlock'
import BottomNav from '@/components/ui/BottomNav'
import { useRouter } from 'next/navigation'
import { getDailyAdvice } from '@/lib/advisor'
import { useAdvisor } from '@/hooks/useAdvisor'

function getLocalISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(getLocalISODate)
  const [userId, setUserId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [books, setBooks] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set())
  const [startingWorkout, setStartingWorkout] = useState(false)
  const [showDate, setShowDate] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const rawAdvice = useMemo(() => getDailyAdvice(metrics, !!workout), [metrics, workout])
  const { advice, isDismissed, dismissAdvice, restoreAdvice } = useAdvisor(rawAdvice)

  useEffect(() => {
    const id = setInterval(() => setShowDate(v => !v), 4000)
    return () => clearInterval(id)
  }, [])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    const [m, w, b] = await Promise.all([
      getDailyMetrics(user.id, currentDate),
      getTodayWorkout(user.id, currentDate),
      getUserBooks(user.id),
    ])

    setMetrics(m)
    setWorkout(w)
    setBooks(b)

    if (w) {
      const exs = await getExercisesForWorkout(w.id)
      setExercises(exs)
    } else {
      setExercises([])
    }

    setLoading(false)
  }, [router, currentDate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const checkDate = () => {
      const actual = getLocalISODate()
      if (actual !== currentDate) {
        setLoading(true)
        setCurrentDate(actual)
      }
    }

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkDate()
    })
    window.addEventListener('focus', checkDate)
    const interval = setInterval(checkDate, 60000)

    return () => {
      window.removeEventListener('visibilitychange', checkDate)
      window.removeEventListener('focus', checkDate)
      clearInterval(interval)
    }
  }, [currentDate])

  async function saveMetrics(updates: Partial<DailyMetrics>, fieldKeys: string[]) {
    if (!userId) return
    setSavingFields(prev => new Set([...prev, ...fieldKeys]))
    try {
      const updated = await upsertDailyMetrics(userId, currentDate, updates as any)
      setMetrics(updated)
    } finally {
      setSavingFields(prev => {
        const next = new Set(prev)
        fieldKeys.forEach(k => next.delete(k))
        return next
      })
    }
  }

  function handleSleepChange(hours: number) {
    setMetrics(m => m ? { ...m, sleep_hours: hours } : { sleep_hours: hours } as any)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveMetrics({ sleep_hours: hours }, ['sleep'])
    }, 600)
  }

  function handleStateChange(field: 'energy' | 'stress' | 'motivation' | 'free_time', value: number) {
    setMetrics(m => m ? { ...m, [field]: value } : { [field]: value } as any)
    saveMetrics({ [field]: value }, [field])
  }

  function handleReadingChange(updates: { book_title?: string; pages_read?: number; book_total_pages?: number }) {
    setMetrics(m => m ? { ...m, ...updates } : { ...updates } as any)
    saveMetrics(updates as any, Object.keys(updates))
    if (updates.book_title && !books.includes(updates.book_title)) {
      setBooks(b => [...b, updates.book_title!].sort())
    }
  }

  function handleToggleLock(field: 'reading_locked' | 'workout_locked') {
    const isLocked = metrics?.[field] === true
    setMetrics(m => m ? { ...m, [field]: !isLocked } : { [field]: !isLocked } as any)
    saveMetrics({ [field]: !isLocked }, [field])
  }

  async function handleStartWorkout() {
    if (!userId) return
    setStartingWorkout(true)
    try {
      const w = await createWorkout(userId, currentDate)
      setWorkout(w)
      setExercises([])
    } finally {
      setStartingWorkout(false)
    }
  }

  async function handleResetMetrics() {
    if (!userId) return
    if (!confirm('¿Estás seguro de que quieres reiniciar las métricas y los hábitos de hoy?')) return

    const resetData = {
      sleep_hours: null,
      energy: null,
      stress: null,
      motivation: null,
      free_time: null,
      book_title: null,
      pages_read: null
    }

    setLoading(true)
    try {
      await upsertDailyMetrics(userId, currentDate, resetData)
      setMetrics(prev => prev ? { ...prev, ...resetData } : null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 pb-24">
      <header className="sticky top-0 bg-surface-0/90 backdrop-blur-md border-b border-surface-border z-20 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-center relative">
          <button
            onClick={handleResetMetrics}
            className="absolute left-4 text-zinc-700 hover:text-white p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            title="Reiniciar métricas de hoy"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="relative h-5 w-40 flex items-center justify-center overflow-hidden">
            <span
              className="absolute font-bold text-sm tracking-widest transition-opacity duration-700"
              style={{ opacity: showDate ? 0 : 1 }}
            >
              VITAL
            </span>
            <span
              className="absolute font-bold text-sm tracking-tight capitalize transition-opacity duration-700"
              style={{ opacity: showDate ? 1 : 0 }}
            >
              {new Date(currentDate + 'T12:00:00').toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="absolute right-12 flex items-center">
            {advice && isDismissed && (
              <button onClick={restoreAdvice} className="text-brand-400 hover:bg-surface-2 p-1.5 rounded-lg transition-colors">
                <Bell className="w-4 h-4 animate-pulse" />
              </button>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="absolute right-4 text-zinc-700 hover:text-white p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>
      </header>

      <main className="w-full max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-4">

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 auto-rows-auto">

          <div className="col-span-1 min-h-[130px]">
            <ClockWeatherBlock
              cachedTemp={metrics?.weather_temp}
              cachedCondition={metrics?.weather_condition}
            />
          </div>

          <div className="col-span-1 row-span-2 min-h-[280px]">
            <SleepBlock
              value={metrics?.sleep_hours ?? null}
              onChange={handleSleepChange}
              saving={savingFields.has('sleep')}
            />
          </div>

          <div className="col-span-1 min-h-[140px]">
            <ScoreBlock metrics={metrics} hasWorkout={!!workout} />
          </div>

          <div className="col-span-2 md:col-span-3 xl:col-span-1 min-h-[160px]">
            <StateBlock
              energy={metrics?.energy ?? null}
              stress={metrics?.stress ?? null}
              motivation={metrics?.motivation ?? null}
              freeTime={metrics?.free_time ?? null}
              onChange={handleStateChange}
              saving={savingFields.has('energy') || savingFields.has('stress') || savingFields.has('motivation')}
            />
          </div>

          <div className="col-span-1 min-h-[220px]">
            <ReadingBlock
              bookTitle={metrics?.book_title ?? null}
              pagesRead={metrics?.pages_read ?? null}
              bookTotalPages={metrics?.book_total_pages ?? null}
              bookSuggestions={books}
              onChange={handleReadingChange}
              saving={savingFields.has('book_title') || savingFields.has('pages_read')}
              isLocked={metrics?.reading_locked ?? false}
              onToggleLock={() => handleToggleLock('reading_locked')}
            />
          </div>

          <div className="col-span-1 min-h-[220px]">
            <WorkoutBlock
              workout={workout}
              exercises={exercises}
              onStart={handleStartWorkout}
              starting={startingWorkout}
              isLocked={metrics?.workout_locked ?? false}
              onToggleLock={() => handleToggleLock('workout_locked')}
            />
          </div>

        </div>
      </main>

      {advice && !isDismissed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={dismissAdvice}
        >
          <div
            className="bg-surface-1 border border-surface-border shadow-2xl rounded-2xl p-6 w-full max-w-sm relative animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={dismissAdvice}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-brand-400" />
              </div>
              <p className="font-semibold text-white text-sm">Tu Coach Diario</p>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">{advice.text}</p>

            <button
              onClick={dismissAdvice}
              className="mt-5 w-full py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-zinc-400 hover:text-white text-sm transition-colors touch-manipulation"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
