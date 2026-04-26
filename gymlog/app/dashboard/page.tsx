'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { LogOut, RotateCcw, Sparkles, Bell, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getTodayWorkout, createWorkout, getExercisesForWorkout, getRecentWorkoutsWithExercises, getUserProfile } from '@/lib/db'
import { getDailyMetrics, upsertDailyMetrics, getRecentMetrics } from '@/lib/metrics'
import { getTodayArtsSummary, upsertArtDailyState } from '@/lib/arts'
import type { Workout, Exercise, DailyMetrics, UserProfile, WorkoutWithExercises, TodayArtsSummary } from '@/types'
import SleepBlock from '@/components/bento/SleepBlock'
import ClockWeatherBlock from '@/components/bento/ClockWeatherBlock'
import StateBlock from '@/components/bento/StateBlock'
import ArtsBlock from '@/components/bento/ArtsBlock'
import WorkoutBlock from '@/components/bento/WorkoutBlock'
import ScoreBlock from '@/components/bento/ScoreBlock'
import BottomNav from '@/components/ui/BottomNav'
import PageHeader from '@/components/ui/PageHeader'
import PageLoader from '@/components/ui/PageLoader'
import { useRouter } from 'next/navigation'
import { getDailyAdvice } from '@/lib/advisor'
import { computeVitalityScore } from '@/lib/vitality'
import { useAdvisor } from '@/hooks/useAdvisor'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { useI18n } from '@/contexts/I18nContext'

function getLocalISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mergeMetricIntoHistory(history: DailyMetrics[], metric: DailyMetrics) {
  const next = history.filter(item => item.date !== metric.date)
  return [metric, ...next].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
}

export default function DashboardPage() {
  const { t, language } = useI18n()
  const [currentDate, setCurrentDate] = useState(getLocalISODate)
  const [userId, setUserId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentMetrics, setRecentMetrics] = useState<DailyMetrics[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutWithExercises[]>([])
  const [artsSummary, setArtsSummary] = useState<TodayArtsSummary | null>(null)
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

  const calculatedScores = useMemo(() => {
    if (!profile) return []
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentDate + 'T12:00:00')
      d.setDate(d.getDate() - i)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }).reverse()

    return dates.map(d => {
      let dMetrics = recentMetrics.find(m => m.date === d) || null
      if (d === currentDate && metrics) dMetrics = metrics

      let dWorkout = recentWorkouts.find(w => w.date === d) || null
      if (d === currentDate && workout) {
         dWorkout = { ...workout, exercises }
      }

      let dArts = null
      if (d === currentDate) dArts = artsSummary

      const res = computeVitalityScore({
        profile,
        metrics: dMetrics,
        recentMetrics,
        recentWorkouts,
        todayExercises: dWorkout?.exercises || [],
        hasWorkout: !!dWorkout,
        artsSummary: dArts,
      })
      return res.score
    })
  }, [currentDate, metrics, workout, exercises, profile, recentMetrics, recentWorkouts, artsSummary])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    const [m, w, p, metricsHistory, workoutsHistory, arts] = await Promise.all([
      getDailyMetrics(user.id, currentDate),
      getTodayWorkout(user.id, currentDate),
      getUserProfile(user.id).catch(() => null),
      getRecentMetrics(user.id, 7),
      getRecentWorkoutsWithExercises(user.id, 7),
      getTodayArtsSummary(user.id, currentDate),
    ])

    setMetrics(m)
    setWorkout(w)
    setProfile(p)
    setRecentMetrics(metricsHistory)
    setRecentWorkouts(workoutsHistory)
    setArtsSummary(arts)

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

  function handleStateChange(field: 'energy' | 'stress' | 'motivation' | 'phone_usage', value: number) {
    setMetrics(m => m ? { ...m, [field]: value } : { [field]: value } as any)
    saveMetrics({ [field]: value }, [field])
  }

  async function handleReadingChange(updates: { book_title?: string; pages_read?: number; book_total_pages?: number }) {
    if (!userId) return
    setMetrics(m => m ? { ...m, ...updates } : { ...updates } as any)
    saveMetrics(updates as any, Object.keys(updates))
  }

  function handleToggleLock(field: 'workout_locked') {
    const isLocked = metrics?.[field] === true
    setMetrics(m => m ? { ...m, [field]: !isLocked } : { [field]: !isLocked } as any)
    saveMetrics({ [field]: !isLocked }, [field])
  }

  async function handleToggleArtsLock() {
    if (!userId) return
    const newLocked = !(artsSummary?.dailyState?.arts_locked ?? false)
    const newState = await upsertArtDailyState(userId, currentDate, { arts_locked: newLocked })
    setArtsSummary(prev => prev ? { ...prev, dailyState: newState } : prev)
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
    if (!confirm(t('dashboard.reset_confirm'))) return

    const resetData = {
      sleep_hours: null,
      energy: null,
      stress: null,
      motivation: null,
      phone_usage: null,
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
              title={t('dashboard.reset_title')}
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
              {new Date(currentDate + 'T12:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                day: 'numeric',
                month: 'numeric',
                year: '2-digit'
              })}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageToggle />
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
              artsSummary={artsSummary}
              historicalScores={calculatedScores}
            />
          </div>

          <div className="col-span-2 md:col-span-3 xl:col-span-1 min-h-[160px]">
            <StateBlock
              energy={metrics?.energy ?? null}
              stress={metrics?.stress ?? null}
              motivation={metrics?.motivation ?? null}
              phoneUsage={metrics?.phone_usage ?? null}
              onChange={handleStateChange}
              saving={savingFields.has('energy') || savingFields.has('stress') || savingFields.has('motivation') || savingFields.has('phone_usage')}
            />
          </div>

          <div className="col-span-1 min-h-[220px]">
            <ArtsBlock
              summary={artsSummary}
              isLocked={artsSummary?.dailyState?.arts_locked ?? false}
              onToggleLock={handleToggleArtsLock}
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
              <p className="font-bold text-main text-sm">{t('dashboard.coach_title')}</p>
            </div>

            <p className="text-sm text-main/90 leading-relaxed">{t(`dashboard.advisor.${advice.id}`)}</p>

            <button
              onClick={dismissAdvice}
              className="mt-5 w-full py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-muted hover:text-main font-bold text-sm transition-colors touch-manipulation border border-surface-border"
            >
              {t('dashboard.coach_dismiss')}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
