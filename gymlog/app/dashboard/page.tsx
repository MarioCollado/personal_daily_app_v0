'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { LogOut, RotateCcw, Sparkles, Bell, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getTodayWorkout, createWorkout, getExercisesForWorkout, getRecentWorkoutsWithExercises, getUserProfile } from '@/lib/db'
import { getDailyMetrics, upsertDailyMetrics, getUserBooks, getRecentMetrics } from '@/lib/metrics'
import type { Workout, Exercise, DailyMetrics, UserProfile, WorkoutWithExercises } from '@/types'
import SleepBlock from '@/components/bento/SleepBlock'
import ClockWeatherBlock from '@/components/bento/ClockWeatherBlock'
import StateBlock from '@/components/bento/StateBlock'
import ReadingBlock from '@/components/bento/ReadingBlock'
import WorkoutBlock from '@/components/bento/WorkoutBlock'
import ScoreBlock from '@/components/bento/ScoreBlock'
import BottomNav from '@/components/ui/BottomNav'
import PageHeader from '@/components/ui/PageHeader'
import PageLoader from '@/components/ui/PageLoader'
import { useRouter } from 'next/navigation'
import { getDailyAdvice } from '@/lib/advisor'
import { useAdvisor } from '@/hooks/useAdvisor'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

function getLocalISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mergeMetricIntoHistory(history: DailyMetrics[], metric: DailyMetrics) {
  const next = history.filter(item => item.date !== metric.date)
  return [metric, ...next].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(getLocalISODate)
  const [userId, setUserId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentMetrics, setRecentMetrics] = useState<DailyMetrics[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutWithExercises[]>([])
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

    const [m, w, b, p, metricsHistory, workoutsHistory] = await Promise.all([
      getDailyMetrics(user.id, currentDate),
      getTodayWorkout(user.id, currentDate),
      getUserBooks(user.id),
      getUserProfile(user.id).catch(() => null),
      getRecentMetrics(user.id, 7),
      getRecentWorkoutsWithExercises(user.id, 7),
    ])

    setMetrics(m)
    setWorkout(w)
    setBooks(b)
    setProfile(p)
    setRecentMetrics(metricsHistory)
    setRecentWorkouts(workoutsHistory)

    if (w) {
      const historicalWorkout = workoutsHistory.find(item => item.id === w.id)
      const exs = historicalWorkout?.exercises?.length
        ? historicalWorkout.exercises
        : await getExercisesForWorkout(w.id)
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
      setRecentMetrics(prev => mergeMetricIntoHistory(prev, updated))
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
      setRecentWorkouts(prev => [{ ...w, exercises: [] }, ...prev.filter(item => item.id !== w.id)].slice(0, 7))
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
      const updated = await upsertDailyMetrics(userId, currentDate, resetData)
      setMetrics(updated)
      setRecentMetrics(prev => mergeMetricIntoHistory(prev, updated))
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
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-surface-0 pb-24">
      <PageHeader innerClassName="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between relative">
          <div className="flex items-center gap-1">
            <button
              onClick={handleResetMetrics}
              className="text-muted hover:text-main p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
              title="Reiniciar métricas de hoy"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="relative h-5 w-32 flex items-center justify-center overflow-hidden">
            <span
              className="absolute font-bold text-sm tracking-widest transition-opacity duration-700 text-main"
              style={{ opacity: showDate ? 0 : 1 }}
            >
              VITAL
            </span>
            <span
              className="absolute font-bold text-sm tracking-tight capitalize transition-opacity duration-700 whitespace-nowrap text-main"
              style={{ opacity: showDate ? 1 : 0 }}
            >
              {new Date(currentDate + 'T12:00:00').toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'numeric',
                year: '2-digit'
              })}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />

            {advice && isDismissed && (
              <button onClick={restoreAdvice} className="text-brand-400 hover:bg-surface-2 p-1.5 rounded-lg transition-colors">
                <Bell className="w-4 h-4 animate-pulse" />
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="text-muted hover:text-main p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
      </PageHeader>

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
            <ScoreBlock
              metrics={metrics}
              hasWorkout={!!workout}
              profile={profile}
              recentMetrics={recentMetrics}
              recentWorkouts={recentWorkouts}
              todayExercises={exercises}
            />
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
              className="absolute top-4 right-4 text-muted hover:text-main transition-colors p-1 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-brand" />
              </div>
              <p className="font-bold text-main text-sm">Tu Coach Diario</p>
            </div>

            <p className="text-sm text-main/90 leading-relaxed">{advice.text}</p>

            <button
              onClick={dismissAdvice}
              className="mt-5 w-full py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-muted hover:text-main font-bold text-sm transition-colors touch-manipulation border border-surface-border"
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
