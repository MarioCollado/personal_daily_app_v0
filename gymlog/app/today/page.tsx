'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  Dumbbell,
  Pencil,
  Check,
  Copy,
  LogOut,
  Lock,
  User,
  CheckCircle,
  LayoutTemplate,
  X,
  Calendar,
  ChevronRight,
  TrendingUp,
  Clock3,
  RotateCcw,
  Layers3,
  Flame,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase-client'
import {
  getTodayWorkout,
  createWorkout,
  getExercisesForWorkout,
  updateWorkoutName,
  getExerciseNames,
  getWorkoutHistory,
  duplicateWorkout,
  getUserProfile,
  upsertUserProfile,
  finishWorkout,
  deleteWorkout,
  startWorkoutTimer,
  resetWorkoutTimer,
  getTemplates,
  saveTemplate,
  applyTemplate,
  getRecentWorkoutsWithExercises,
} from '@/lib/db'
import { getDailyMetrics, upsertDailyMetrics } from '@/lib/metrics'
import { getWorkoutLoadValue } from '@/lib/workout-insights'
import type { Workout, Exercise, Set, UserProfile, WorkoutTemplate } from '@/types'
import ExerciseCard from '@/components/workout/ExerciseCard'
import AddExerciseModal from '@/components/workout/AddExerciseModal'
import BottomNav from '@/components/ui/BottomNav'
import PageHeader from '@/components/ui/PageHeader'
import { useLongPress } from '@/hooks/useLongPress'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { useI18n } from '@/contexts/I18nContext'
import WorkoutSummaryModal from '@/components/workout/WorkoutSummaryModal'
import TemplatePickerModal from '@/components/workout/TemplatePickerModal'
import WorkoutQuickActionsSheet from '@/components/workout/WorkoutQuickActionsSheet'
import MuscleInsightsPanel from '@/components/workout/MuscleInsightsPanel'

interface WorkoutWithExercises extends Workout {
  exercises?: Exercise[]
}

function getLocalISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatElapsed(startedAt?: string | null, finishedAt?: string | null) {
  if (!startedAt) return '--'
  const endTime = finishedAt ? new Date(finishedAt).getTime() : Date.now()
  const mins = Math.max(0, Math.floor((endTime - new Date(startedAt).getTime()) / 60000))
  const h = Math.floor(mins / 60)
  return h > 0 ? `${h}h ${mins % 60}m` : `${mins} min`
}

export default function TodayPage() {
  const { t, language } = useI18n()
  const router = useRouter()

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [lastWorkout, setLastWorkout] = useState<Workout | null>(null)
  const [duplicating, setDuplicating] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileInput, setProfileInput] = useState({ weight: '', height: '', age: '' })
  const [currentDate, setCurrentDate] = useState(getLocalISODate)
  const [showSummary, setShowSummary] = useState(false)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const [historyWorkouts, setHistoryWorkouts] = useState<WorkoutWithExercises[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutWithExercises[]>([])
  const [showHistoryList, setShowHistoryList] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [loadingHistoryDetail, setLoadingHistoryDetail] = useState<string | null>(null)
  const [, setTimerTick] = useState(0)

  const daysAgoStr = (iso: string) => {
    const d1 = new Date(iso + 'T00:00:00')
    const d2 = new Date()
    d2.setHours(0, 0, 0, 0)
    const diff = Math.floor((d2.getTime() - d1.getTime()) / 86400000)
    if (diff === 0) return ''
    if (diff === 1) return t('common.dayAgo')
    return t('common.daysAgo', { count: diff })
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setUserId(user.id)

    const w = await getTodayWorkout(user.id, currentDate)
    const metrics = await getDailyMetrics(user.id, currentDate)
    const userProfile = await getUserProfile(user.id).catch(() => null)

    setIsLocked(metrics?.workout_locked || false)
    setProfile(userProfile)
    setWorkout(w)

    if (w) {
      setWorkoutName(w.name || '')
      setExercises(await getExercisesForWorkout(w.id))
    } else {
      setWorkoutName('')
      setExercises([])
    }

    setSuggestions(await getExerciseNames(user.id))

    const [history, recentWithExercises, userTemplates] = await Promise.all([
      getWorkoutHistory(user.id, 15),
      getRecentWorkoutsWithExercises(user.id, 28),
      getTemplates(user.id),
    ])

    setHistoryWorkouts(history)
    setRecentWorkouts(recentWithExercises)
    setLastWorkout(history.find(item => item.date !== currentDate) || null)
    setTemplates(userTemplates)
    setLoading(false)
  }, [currentDate, router])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const checkDate = () => {
      const actual = getLocalISODate()
      if (actual !== currentDate) {
        setLoading(true)
        setCurrentDate(actual)
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkDate()
    }

    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', checkDate)
    const interval = setInterval(checkDate, 60000)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', checkDate)
      clearInterval(interval)
    }
  }, [currentDate])

  useEffect(() => {
    if (!workout?.started_at || workout.finished_at) return
    const interval = setInterval(() => setTimerTick(value => value + 1), 15000)
    return () => clearInterval(interval)
  }, [workout?.started_at, workout?.finished_at])

  async function startWorkout(openComposer = false) {
    if (!userId) return
    const w = await createWorkout(userId, currentDate)
    setWorkout(w)
    setExercises([])
    setWorkoutName(w.name || '')
    if (openComposer) setShowAddExercise(true)
  }

  async function saveName() {
    if (!workout) return
    await updateWorkoutName(workout.id, workoutName)
    setWorkout(prev => prev ? { ...prev, name: workoutName } : prev)
    setEditingName(false)
  }

  async function handleStartTimer() {
    if (!workout || workout.started_at) return
    const startedAt = await startWorkoutTimer(workout.id)
    setWorkout(prev => prev ? { ...prev, started_at: startedAt } : prev)
  }

  async function handleResetTimer() {
    if (!workout || !workout.started_at || workout.finished_at) return
    const startedAt = await resetWorkoutTimer(workout.id)
    setWorkout(prev => prev ? { ...prev, started_at: startedAt } : prev)
    setTimerTick(value => value + 1)
  }

  async function handleDuplicate() {
    if (!lastWorkout || !userId) return
    setDuplicating(true)
    setShowQuickActions(false)

    try {
      const w = await duplicateWorkout(lastWorkout.id, userId, currentDate)
      setWorkout(w)
      setWorkoutName(w.name || '')
      setExercises(await getExercisesForWorkout(w.id))
    } finally {
      setDuplicating(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function handleFinishWorkout(durationMinutes?: number) {
    if (!workout) return
    await finishWorkout(workout.id, durationMinutes)
    setWorkout(prev => prev ? { ...prev, finished_at: new Date().toISOString() } : prev)
    setShowSummary(false)
    setShowQuickActions(false)
    setIsLocked(true)
  }

  async function handleDeleteWorkout() {
    if (!workout) return
    if (!confirm('Estas seguro de que quieres borrar el entreno de hoy? Esta accion no se puede deshacer.')) return

    await deleteWorkout(workout.id)
    setWorkout(null)
    setExercises([])
    setWorkoutName('')
    setIsLocked(false)
    setShowQuickActions(false)
  }

  async function handleApplyTemplate(template: WorkoutTemplate) {
    let targetWorkout = workout
    setApplyingTemplate(true)
    setShowTemplatePicker(false)
    setShowQuickActions(false)

    try {
      if (!targetWorkout && userId) {
        targetWorkout = await createWorkout(userId, currentDate)
        setWorkout(targetWorkout)
        setWorkoutName(targetWorkout.name || '')
      }
      if (!targetWorkout) return

      const newExercises = await applyTemplate(targetWorkout.id, template.id)
      setExercises(prev => [...prev, ...newExercises])
    } finally {
      setApplyingTemplate(false)
    }
  }

  async function handleSaveTemplate(name: string, filteredExercises?: Exercise[]) {
    if (!userId) return
    if (templates.length >= 6) throw new Error('Has alcanzado el limite de 6 plantillas')

    const exsToSave = filteredExercises ?? exercises
    const newTemplate = await saveTemplate(
      userId,
      name,
      exsToSave.map(ex => ({ name: ex.name, muscle_group: ex.muscle_group }))
    )

    setTemplates(prev => [{ ...newTemplate, exercises: [] }, ...prev])
  }

  function handleExerciseAdded(ex: Exercise) {
    setExercises(prev => [...prev, { ...ex, sets: [] }])
  }

  function handleExerciseDeleted(id: string) {
    setExercises(prev => prev.filter(ex => ex.id !== id))
  }

  function handleSetAdded(exerciseId: string, set: Set) {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, sets: [...(ex.sets || []), set] } : ex
    ))
  }

  function handleSetDeleted(exerciseId: string, setId: string) {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, sets: (ex.sets || []).filter(set => set.id !== setId) } : ex
    ))
  }

  async function toggleLock() {
    if (!userId) return
    const nextState = !isLocked
    setIsLocked(nextState)
    await upsertDailyMetrics(userId, currentDate, { workout_locked: nextState })
  }

  function startEditingProfile() {
    if (isLocked) return
    setProfileInput({
      weight: profile?.weight?.toString() || '',
      height: profile?.height?.toString() || '',
      age: profile?.age?.toString() || '',
    })
    setEditingProfile(true)
  }

  async function saveProfile() {
    if (!userId) return
    const updates = {
      weight: parseFloat(profileInput.weight) || null,
      height: parseInt(profileInput.height) || null,
      age: parseInt(profileInput.age) || null,
    }

    const updated = await upsertUserProfile(userId, updates).catch(() => null)
    if (updated) setProfile(updated)
    setEditingProfile(false)
  }

  async function toggleExpandHistory(workoutId: string) {
    if (expandedHistory === workoutId) {
      setExpandedHistory(null)
      return
    }

    const historyWorkout = historyWorkouts.find(item => item.id === workoutId)
    if (!historyWorkout?.exercises) {
      setLoadingHistoryDetail(workoutId)
      const exs = await getExercisesForWorkout(workoutId)
      setHistoryWorkouts(prev => prev.map(item => item.id === workoutId ? { ...item, exercises: exs } : item))
      setLoadingHistoryDetail(null)
    }

    setExpandedHistory(workoutId)
  }

  const longPress = useLongPress({ onLongPress: toggleLock })

  const sparklineWorkouts = useMemo(() => {
    if (!workout) return recentWorkouts
    return [{ ...workout, exercises }, ...recentWorkouts.filter(item => item.id !== workout.id)]
  }, [workout, exercises, recentWorkouts])

  const totalSets = useMemo(
    () => exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0),
    [exercises]
  )

  const trainingLoad = useMemo(() => getWorkoutLoadValue(exercises), [exercises])
  const historyCount = historyWorkouts.filter(item => item.date !== currentDate).length

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted text-sm font-medium">{t('today_page.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 pb-36">
      <PageHeader innerClassName="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-brand" />
            <h1 className="font-bold text-base text-main">{t('today_page.title')}</h1>
          </div>
          <p className="text-muted text-xs font-bold capitalize mt-0.5 tracking-tight">{formatDate(currentDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button onClick={handleSignOut} className="text-muted hover:text-main p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      <main
        className={clsx(
          'max-w-lg mx-auto px-4 pt-3 space-y-4 relative',
          isLocked && 'select-none [-webkit-touch-callout:none]'
        )}
        {...longPress}
      >
        {isLocked && workout && (
          <div className="absolute inset-0 z-30 bg-surface-0/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 m-2 rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-brand" />
            </div>
            <span className="text-brand font-bold text-xl">{t('today_page.finalized')}</span>
            <span className="text-muted mt-2 text-sm text-center font-bold">{t('today_page.unlock_hint')}</span>
          </div>
        )}

        <div className="rounded-2xl border border-surface-border bg-surface-1/90 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-500/12 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-brand-500" />
              </div>
              {editingProfile ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    placeholder={t('profile.weight_placeholder')}
                    value={profileInput.weight}
                    onChange={e => setProfileInput(s => ({ ...s, weight: e.target.value }))}
                    className="w-14 bg-surface-2 border border-surface-border rounded-md px-2 py-1.5 text-xs text-main"
                  />
                  <input
                    type="number"
                    placeholder={t('profile.height_placeholder')}
                    value={profileInput.height}
                    onChange={e => setProfileInput(s => ({ ...s, height: e.target.value }))}
                    className="w-14 bg-surface-2 border border-surface-border rounded-md px-2 py-1.5 text-xs text-main"
                  />
                  <input
                    type="number"
                    placeholder={t('profile.age_placeholder')}
                    value={profileInput.age}
                    onChange={e => setProfileInput(s => ({ ...s, age: e.target.value }))}
                    className="w-12 bg-surface-2 border border-surface-border rounded-md px-2 py-1.5 text-xs text-main"
                  />
                  <button onClick={saveProfile} className="text-brand-400 p-1.5 hover:bg-brand-500/10 rounded-md">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditingProfile}
                  className="text-left min-w-0"
                >
                  <p className="text-sm font-semibold text-main truncate">
                    {profile?.weight ? `${profile.weight}kg` : '--kg'} · {profile?.height ? `${profile.height}cm` : '--cm'}
                  </p>
                  <p className="text-[11px] text-muted">
                    {profile?.age ? t('profile.years', { count: profile.age }) : t('profile.add_age')}
                  </p>
                </button>
              )}
            </div>

            {!editingProfile && !isLocked && (
              <button onClick={startEditingProfile} className="text-muted hover:text-main p-2 rounded-lg hover:bg-surface-2 transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!workout ? (
          <section className="space-y-4 animate-fade-in">
            <div className="rounded-[28px] border border-surface-border bg-gradient-to-br from-surface-1 via-surface-1 to-surface-2/80 p-5 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/12 flex items-center justify-center mb-4">
                <Dumbbell className="w-7 h-7 text-brand-500" />
              </div>
              <h2 className="text-2xl font-bold text-main">{t('today_page.empty_title')}</h2>
              <p className="mt-2 text-sm text-muted max-w-sm">{t('today_page.empty_desc')}</p>
              <button
                onClick={() => startWorkout(true)}
                className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('today_page.start_workout')}
              </button>
            </div>

            <div className="rounded-3xl border border-surface-border bg-surface-1 p-2 shadow-sm">
              <button
                onClick={() => setShowTemplatePicker(true)}
                disabled={templates.length === 0 || applyingTemplate}
                className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-surface-2 transition-colors disabled:opacity-40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
                    <LayoutTemplate className="w-4 h-4 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-main">Usar plantilla</p>
                    <p className="text-[11px] text-muted">{templates.length > 0 ? `${templates.length} disponibles` : 'Aun no tienes plantillas'}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted" />
              </button>

              {lastWorkout && (
                <button
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
                      <Copy className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-main">{duplicating ? t('today_page.duplicating') : 'Repetir ultimo entreno'}</p>
                      <p className="text-[11px] text-muted capitalize">{formatDate(lastWorkout.date)}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted" />
                </button>
              )}
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-[28px] border border-surface-border bg-surface-1 shadow-sm mb-4">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={workoutName}
                          onChange={e => setWorkoutName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveName()}
                          placeholder={t('today_page.workout_placeholder')}
                          className="input-field flex-1 text-sm"
                        />
                        <button onClick={saveName} className="btn-primary px-3 py-2">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingName(true)}
                        className="flex items-center gap-2 text-left group"
                      >
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Sesion activa</p>
                          <p className="mt-1 text-base font-semibold text-main truncate">
                            {workout.name || t('today_page.workout_no_name')}
                          </p>
                        </div>
                        <Pencil className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>

                  {workout.finished_at ? (
                    <button
                      onClick={handleDeleteWorkout}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Borrar entreno"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSummary(true)}
                      disabled={exercises.length === 0}
                      className="shrink-0 rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-opacity disabled:opacity-40"
                    >
                      {t('today_page.finish_workout')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="rounded-2xl border border-surface-border bg-surface-2/80 px-3 py-3">
                    <div className="flex items-center justify-between gap-2 text-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
                      <div className="flex items-center gap-2">
                        Tiempo
                      </div>
                      {workout.started_at && !workout.finished_at && (
                        <button
                          onClick={handleResetTimer}
                          className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-surface-1 transition-colors"
                          title="Reiniciar cronometro"
                          aria-label="Reiniciar cronometro"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {workout.started_at ? (
                      <>
                        <p className="mt-2 text-base font-bold text-main">{formatElapsed(workout.started_at, workout.finished_at)}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {workout.finished_at ? 'Cronometro finalizado' : 'Cronometro en marcha'}
                        </p>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleStartTimer}
                          className="mt-2 w-full rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground"
                        >
                          Empezar entreno
                        </button>
                      </>
                    )}
                  </div>
                  <div className="rounded-2xl border border-surface-border bg-surface-2/80 px-3 py-3">
                    <div className="flex items-center gap-2 text-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
                      Ejercicios
                    </div>
                    <p className="mt-2 text-base font-bold text-main">{exercises.length}</p>
                    <p className="text-[11px] text-muted mt-0.5">{totalSets} series</p>
                  </div>
                  <div className="rounded-2xl border border-surface-border bg-surface-2/80 px-3 py-3">
                    <div className="flex items-center gap-2 text-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
                      Carga
                    </div>
                    <p className="mt-2 text-base font-bold text-main">{trainingLoad}</p>
                    <p className="text-[11px] text-muted mt-0.5">{workout.finished_at ? 'Sesion cerrada' : 'En progreso'}</p>
                  </div>
                </div>
              </div>
            </section>

            {workout.finished_at && (
              <div className="relative z-10 flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-2xl px-4 py-3 text-brand-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Entreno completado</span>
                <span className="ml-auto text-xs text-muted font-normal">
                  {formatElapsed(workout.started_at, workout.finished_at)}
                </span>
              </div>
            )}

            {!workout.finished_at && exercises.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-surface-border bg-surface-1/80 p-5 text-center">
                <p className="text-lg font-semibold text-main">Empieza anadiendo tu primer ejercicio</p>
                <p className="text-sm text-muted mt-2">Toca el boton flotante para crear un ejercicio o cargar una plantilla.</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowAddExercise(true)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crear ejercicio
                  </button>
                  <button
                    onClick={() => setShowTemplatePicker(true)}
                    disabled={templates.length === 0 || applyingTemplate}
                    className="flex-1 rounded-2xl border border-surface-border bg-surface-2 px-4 py-3 text-sm font-semibold text-main disabled:opacity-40"
                  >
                    Usar plantilla
                  </button>
                </div>
              </div>
            )}

            <div className="relative z-10 space-y-3">
              {exercises.map(exercise => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  userId={userId}
                  onDelete={handleExerciseDeleted}
                  onSetAdded={handleSetAdded}
                  onSetDeleted={handleSetDeleted}
                />
              ))}
            </div>

            {exercises.length > 0 && (
              <MuscleInsightsPanel
                exercises={exercises}
                workouts={sparklineWorkouts}
                currentDate={currentDate}
              />
            )}
          </>
        )}

        {historyCount > 0 && (
          <div className="pt-2 space-y-3">
            <button
              onClick={() => setShowHistoryList(prev => !prev)}
              className="flex items-center justify-between w-full p-2 -ml-2 rounded-xl hover:bg-surface-2 transition-colors group touch-manipulation"
            >
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted pl-1 group-hover:text-main transition-colors">
                Historial
              </h3>
              <ChevronRight className={clsx('w-4 h-4 text-muted transition-transform', showHistoryList && 'rotate-90')} />
            </button>

            {showHistoryList && (
              <div className="space-y-2 animate-slide-up">
                {historyWorkouts.filter(item => item.date !== currentDate).map(historyWorkout => (
                  <div key={historyWorkout.id} className="card overflow-hidden">
                    <button
                      onClick={() => toggleExpandHistory(historyWorkout.id)}
                      className="w-full flex items-center gap-3 p-4 text-left touch-manipulation"
                    >
                      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-muted" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold capitalize text-sm">{formatDate(historyWorkout.date)}</div>
                        <div className="text-muted text-[11px] flex items-center gap-2 flex-wrap mt-0.5">
                          <span>{daysAgoStr(historyWorkout.date)}</span>
                          {historyWorkout.name && <><span>·</span><span className="truncate">{historyWorkout.name}</span></>}
                          {historyWorkout.started_at && historyWorkout.finished_at && (
                            <>
                              <span>·</span>
                              <span className="font-mono">{formatElapsed(historyWorkout.started_at, historyWorkout.finished_at)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={clsx(
                          'w-4 h-4 text-muted transition-transform flex-shrink-0',
                          expandedHistory === historyWorkout.id && 'rotate-90'
                        )}
                      />
                    </button>

                    {expandedHistory === historyWorkout.id && (
                      <div className="border-t border-surface-border animate-slide-up">
                        {loadingHistoryDetail === historyWorkout.id ? (
                          <div className="p-4 flex justify-center">
                            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="p-4 space-y-3">
                            {(historyWorkout.exercises || []).map(exercise => (
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
                                        <span className="text-main">{set.weight}kg x {set.reps}</span>
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
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showAddExercise && workout && (
        <AddExerciseModal
          workoutId={workout.id}
          suggestions={suggestions}
          onAdd={handleExerciseAdded}
          onClose={() => setShowAddExercise(false)}
        />
      )}

      {showSummary && workout && (
        <WorkoutSummaryModal
          workout={workout}
          exercises={exercises}
          onConfirm={handleFinishWorkout}
          onCancel={() => setShowSummary(false)}
          onSaveTemplate={handleSaveTemplate}
          canSaveTemplate={templates.length < 6}
        />
      )}

      {showTemplatePicker && (
        <TemplatePickerModal
          templates={templates}
          onSelect={handleApplyTemplate}
          onDeleted={id => setTemplates(prev => prev.filter(template => template.id !== id))}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {workout && !workout.finished_at && !isLocked && (
        <>
          <button
            onClick={() => setShowQuickActions(true)}
            className="fixed right-5 bottom-28 z-40 h-14 w-14 rounded-full bg-brand text-brand-foreground shadow-[0_18px_40px_rgba(0,0,0,0.28)] flex items-center justify-center transition-transform hover:scale-[1.03]"
            aria-label="Abrir acciones rapidas"
          >
            <Plus className="w-6 h-6" />
          </button>
          <WorkoutQuickActionsSheet
            open={showQuickActions}
            onClose={() => setShowQuickActions(false)}
            onAddExercise={() => {
              setShowQuickActions(false)
              setShowAddExercise(true)
            }}
            onUseTemplate={() => {
              setShowQuickActions(false)
              setShowTemplatePicker(true)
            }}
            onDuplicate={lastWorkout ? handleDuplicate : undefined}
            duplicateLabel={lastWorkout ? `Repetir ${formatDate(lastWorkout.date)}` : undefined}
            duplicating={duplicating}
            templatesCount={templates.length}
          />
        </>
      )}

      <BottomNav />
    </div>
  )
}
