'use client'
import { useState, useEffect } from 'react'
import { Calendar, ChevronRight, Dumbbell, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { getWorkoutHistory, getExercisesForWorkout } from '@/lib/db'
import type { Workout, Exercise } from '@/types'
import BottomNav from '@/components/ui/BottomNav'
import PageHeader from '@/components/ui/PageHeader'
import PageLoader from '@/components/ui/PageLoader'
import EmptyState from '@/components/ui/EmptyState'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { useI18n } from '@/contexts/I18nContext'

interface WorkoutWithExercises extends Workout {
  exercises?: Exercise[]
}

export default function HistoryPage() {
  const { t, language } = useI18n()
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const router = useRouter()

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (iso === today) return t('common.today')
    if (iso === yesterday) return t('common.yesterday')
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const daysAgoStr = (iso: string) => {
    const d1 = new Date(iso + 'T00:00:00')
    const d2 = new Date()
    d2.setHours(0, 0, 0, 0)
    const diff = Math.floor((d2.getTime() - d1.getTime()) / 86400000)

    if (diff === 0) return ''
    if (diff === 1) return t('common.dayAgo')
    return t('common.daysAgo', { count: diff })
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const history = await getWorkoutHistory(user.id, 30)
      setWorkouts(history)
      setLoading(false)
    }
    load()
  }, [router])

  async function toggleExpand(workoutId: string) {
    if (expanded === workoutId) { setExpanded(null); return }
    const workout = workouts.find(item => item.id === workoutId)
    if (!workout?.exercises) {
      setLoadingDetail(workoutId)
      const exs = await getExercisesForWorkout(workoutId)
      setWorkouts(prev => prev.map(item => item.id === workoutId ? { ...item, exercises: exs } : item))
      setLoadingDetail(null)
    }
    setExpanded(workoutId)
  }

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-surface-0 pb-24">
      <PageHeader innerClassName="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            <h1 className="font-bold text-base text-main">{t('history.title')}</h1>
          </div>
          <p className="text-muted text-xs mt-0.5">{t('history.sessions', { count: workouts.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </PageHeader>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-2">
        {workouts.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8 text-muted" />}
            title={t('history.no_history')}
            description={t('history.no_history_desc')}
            action={<Link href="/today" className="btn-primary text-sm">{t('history.start_now')}</Link>}
          />
        ) : (
          workouts.map(workout => (
            <div key={workout.id} className="card overflow-hidden animate-fade-in">
              <button
                onClick={() => toggleExpand(workout.id)}
                className="w-full flex items-center gap-3 p-4 text-left touch-manipulation"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5 text-muted" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold capitalize">{formatDate(workout.date)}</div>
                  <div className="text-muted text-xs flex items-center gap-2 flex-wrap">
                    <span>{daysAgoStr(workout.date)}</span>
                    {workout.name && <><span>·</span><span className="truncate">{workout.name}</span></>}
                    {workout.started_at && workout.finished_at && (
                      <>
                        <span>·</span>
                        <span className="font-mono">
                          {(() => {
                            const ms = new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime()
                            const mins = Math.floor(ms / 60000)
                            const h = Math.floor(mins / 60)
                            return h > 0 ? `${h}h ${mins % 60}min` : `${mins} min`
                          })()}
                        </span>
                      </>
                    )}
                    {!workout.finished_at && (
                      <span className="text-zinc-700 italic">sin cerrar</span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  className={clsx(
                    'w-4 h-4 text-muted transition-transform flex-shrink-0',
                    expanded === workout.id && 'rotate-90'
                  )}
                />
              </button>

              {expanded === workout.id && (
                <div className="border-t border-surface-border animate-slide-up">
                  {loadingDetail === workout.id ? (
                    <div className="p-4 flex justify-center">
                      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {(workout.exercises || []).map(exercise => (
                        <div key={exercise.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-main">{exercise.name}</span>
                            {exercise.muscle_group && (
                              <span className="text-xs text-muted">{exercise.muscle_group}</span>
                            )}
                          </div>

                          {(exercise.sets || []).length > 0 && (
                            <div className="space-y-0.5">
                              {(exercise.sets || []).map((set, index) => (
                                <div key={set.id} className="flex items-center gap-3 text-xs text-muted font-mono">
                                  <span className="text-muted/70">#{index + 1}</span>
                                  <span className="text-main">{set.weight}kg × {set.reps}</span>
                                  {set.rir != null && <span>@{set.rir} RIR</span>}
                                </div>
                              ))}
                            </div>
                          )}

                          <Link
                            href={`/exercise/${encodeURIComponent(exercise.name)}`}
                            className="inline-flex items-center gap-1 mt-1 text-xs text-brand-500/70 hover:text-brand-400 transition-colors"
                          >
                            <TrendingUp className="w-3 h-3" />
                            {t('history.view_progression')}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}
