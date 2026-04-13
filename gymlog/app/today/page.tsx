'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Dumbbell, Pencil, Check, Copy, LogOut, Lock, User, CheckCircle, LayoutTemplate, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import {
  getTodayWorkout, createWorkout, getExercisesForWorkout,
  updateWorkoutName, getExerciseNames, getWorkoutHistory, duplicateWorkout,
  getUserProfile, upsertUserProfile, finishWorkout, deleteWorkout
} from '@/lib/db'
import { getDailyMetrics, upsertDailyMetrics } from '@/lib/metrics'
import type { Workout, Exercise, Set, UserProfile } from '@/types'
import ExerciseCard from '@/components/workout/ExerciseCard'
import AddExerciseModal from '@/components/workout/AddExerciseModal'
import BottomNav from '@/components/ui/BottomNav'
import PageHeader from '@/components/ui/PageHeader'

import { useLongPress } from '@/hooks/useLongPress'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { useI18n } from '@/contexts/I18nContext'
import WorkoutSummaryModal from '@/components/workout/WorkoutSummaryModal'
import { getTemplates, saveTemplate, applyTemplate } from '@/lib/db'
import TemplatePickerModal from '@/components/workout/TemplatePickerModal'
import type { WorkoutTemplate } from '@/types'


function getLocalISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TodayPage() {
  const { t, language } = useI18n()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExercise, setShowAddExercise] = useState(false)
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
  const router = useRouter()

  const [currentDate, setCurrentDate] = useState(getLocalISODate)
  const [showSummary, setShowSummary] = useState(false)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState(false)

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    let w = await getTodayWorkout(user.id, currentDate)
    const metrics = await getDailyMetrics(user.id, currentDate)
    const userProfile = await getUserProfile(user.id).catch(() => null)

    setIsLocked(metrics?.workout_locked || false)
    setProfile(userProfile)

    setWorkout(w)
    if (w) {
      setWorkoutName(w.name || '')
      const exs = await getExercisesForWorkout(w.id)
      setExercises(exs)
    } else {
      setWorkoutName('')
      setExercises([])
    }
    const names = await getExerciseNames(user.id)
    setSuggestions(names)

    const history = await getWorkoutHistory(user.id, 5)
    const last = history.find(h => h.date !== currentDate)
    setLastWorkout(last || null)

    const userTemplates = await getTemplates(user.id)
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

  async function startWorkout() {
    if (!userId) return
    const w = await createWorkout(userId, currentDate)
    setWorkout(w)
    setExercises([])
  }

  async function saveName() {
    if (!workout) return
    await updateWorkoutName(workout.id, workoutName)
    setWorkout(w => w ? { ...w, name: workoutName } : w)
    setEditingName(false)
  }

  async function handleDuplicate() {
    if (!lastWorkout || !userId) return
    setDuplicating(true)
    try {
      const w = await duplicateWorkout(lastWorkout.id, userId, currentDate)
      setWorkout(w)
      const exs = await getExercisesForWorkout(w.id)
      setExercises(exs)
    } finally {
      setDuplicating(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function handleFinishWorkout() {
    if (!workout) return
    await finishWorkout(workout.id)
    setShowSummary(false)
    setIsLocked(true)
  }

  async function handleDeleteWorkout() {
    if (!workout) return
    if (!confirm('¿Estás seguro de que quieres borrar el entreno de hoy? Esta acción no se puede deshacer.')) return

    await deleteWorkout(workout.id)
    setWorkout(null)
    setExercises([])
    setIsLocked(false)
  }

  async function handleApplyTemplate(template: WorkoutTemplate) {
    let targetWorkout = workout
    setApplyingTemplate(true)
    setShowTemplatePicker(false)
    try {
      if (!targetWorkout && userId) {
        targetWorkout = await createWorkout(userId, currentDate)
        setWorkout(targetWorkout)
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
    if (templates.length >= 6) throw new Error('Has alcanzado el límite de 6 plantillas')
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
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  function handleSetAdded(exerciseId: string, set: Set) {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, sets: [...(ex.sets || []), set] } : ex
    ))
  }

  function handleSetDeleted(exerciseId: string, setId: string) {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, sets: (ex.sets || []).filter(s => s.id !== setId) } : ex
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
      age: profile?.age?.toString() || ''
    })
    setEditingProfile(true)
  }

  async function saveProfile() {
    if (!userId) return
    const updates = {
      weight: parseFloat(profileInput.weight) || null,
      height: parseInt(profileInput.height) || null,
      age: parseInt(profileInput.age) || null
    }
    const up = await upsertUserProfile(userId, updates).catch(() => null)
    if (up) setProfile(up)
    setEditingProfile(false)
  }

  const longPress = useLongPress({ onLongPress: toggleLock })

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
    <div className="min-h-screen bg-surface-0 pb-32">
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
          "max-w-lg mx-auto px-4 pt-4 space-y-4 relative",
          isLocked && "select-none [-webkit-touch-callout:none]"
        )}
        {...longPress}
      >
        {isLocked && workout && (
          <div className="absolute inset-0 z-20 bg-surface-0/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 m-2 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-brand" />
            </div>
            <span className="text-brand font-bold text-xl">{t('today_page.finalized')}</span>
            <span className="text-muted mt-2 text-sm text-center font-bold">{t('today_page.unlock_hint')}</span>
          </div>
        )}

        {/* User Profile Bar */}
        <div className="bg-surface-1 border border-surface-border rounded-xl p-3 flex items-center justify-between shadow-sm animate-fade-in relative z-10 w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-500" />
            </div>
            {editingProfile ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder={t('profile.weight_placeholder')}
                  value={profileInput.weight}
                  onChange={e => setProfileInput(s => ({ ...s, weight: e.target.value }))}
                  className="w-14 sm:w-16 bg-surface-2 border border-surface-border rounded-md px-2 py-1.5 text-xs text-main touch-manipulation focus:border-brand/40"
                />
                <input
                  type="number"
                  placeholder={t('profile.height_placeholder')}
                  value={profileInput.height}
                  onChange={e => setProfileInput(s => ({ ...s, height: e.target.value }))}
                  className="w-12 sm:w-14 bg-surface-2 border border-surface-border rounded-md px-2 py-1.5 text-xs text-main touch-manipulation focus:border-brand/40"
                />
                <input
                  type="number"
                  placeholder={t('profile.age_placeholder')}
                  value={profileInput.age}
                  onChange={e => setProfileInput(s => ({ ...s, age: e.target.value }))}
                  className="w-12 sm:w-14 bg-surface-2 border border-surface-border rounded-md px-2 py-1.5 text-xs text-main touch-manipulation focus:border-brand/40"
                />
                <button onClick={saveProfile} className="text-brand-400 p-1.5 hover:bg-brand-500/10 rounded-md">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div onClick={startEditingProfile} className="flex flex-col cursor-pointer touch-manipulation group">
                <span className="text-xs font-bold text-main group-hover:text-brand transition-colors">
                  {profile?.weight ? `${profile.weight}kg` : `--kg`} • {profile?.height ? `${profile.height}cm` : `--cm`}
                </span>
                <span className="text-[10px] text-muted font-bold tracking-tight">
                  {profile?.age ? t('profile.years', { count: profile.age }) : t('profile.add_age')}
                </span>
              </div>
            )}
          </div>
          {!editingProfile && !isLocked && (
            <button onClick={startEditingProfile} className="text-muted hover:text-main p-1.5 rounded-md hover:bg-surface-2 transition-colors touch-manipulation">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!workout ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center mb-5 border border-surface-border shadow-inner">
              <Dumbbell className="w-10 h-10 text-muted" />
            </div>
            <h2 className="font-bold text-2xl mb-2 text-main">{t('today_page.empty_title')}</h2>
            <p className="text-muted text-sm mb-6 max-w-xs font-medium">{t('today_page.empty_desc')}</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button onClick={startWorkout} className="btn-primary flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> {t('today_page.start_workout')}
              </button>
              <button
                onClick={() => setShowTemplatePicker(true)}
                disabled={templates.length === 0}
                className="btn-ghost flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                <LayoutTemplate className="w-4 h-4" />
                Usar plantilla
              </button>
              {lastWorkout && (
                <button onClick={handleDuplicate} disabled={duplicating}
                  className="btn-ghost flex items-center justify-center gap-2 text-sm">
                  <Copy className="w-4 h-4" />
                  {duplicating ? t('today_page.duplicating') : t('today_page.copy_last', { date: formatDate(lastWorkout.date) })}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {editingName ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={workoutName}
                    onChange={e => setWorkoutName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    placeholder={t('today_page.workout_placeholder')}
                    className="input-field flex-1 text-sm"
                  />
                  <button onClick={saveName} className="btn-primary px-3 py-2"><Check className="w-4 h-4" /></button>
                </>
              ) : (
                <button onClick={() => setEditingName(true)}
                  className="flex items-center gap-2 text-muted hover:text-main text-sm transition-colors group py-1">
                  <span className="font-bold tracking-tight">{workout.name || t('today_page.workout_no_name')}</span>
                  <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {exercises.length > 0 && (
              <div className="flex gap-4 text-sm bg-surface-1 border border-surface-border rounded-xl px-4 py-3 animate-fade-in shadow-sm">
                <div className="text-center flex-1">
                  <div className="font-mono font-bold text-lg text-brand leading-none mb-1">{exercises.length}</div>
                  <div className="text-muted text-[10px] font-bold uppercase tracking-tighter">{t('today_page.stats.exercises')}</div>
                </div>
                <div className="w-px bg-surface-border" />
                <div className="text-center flex-1">
                  <div className="font-mono font-bold text-lg text-main leading-none mb-1">{exercises.reduce((a, e) => a + (e.sets?.length || 0), 0)}</div>
                  <div className="text-muted text-[10px] font-bold uppercase tracking-tighter">{t('today_page.stats.sets')}</div>
                </div>
                <div className="w-px bg-surface-border" />
                <div className="text-center flex-1">
                  <div className="font-mono font-bold text-lg text-main leading-none mb-1">
                    {exercises.reduce((a, e) => a + (e.sets || []).reduce((b, s) => b + s.reps * s.weight, 0), 0).toLocaleString()}
                  </div>
                  <div className="text-muted text-[10px] font-bold uppercase tracking-tighter">{t('today_page.stats.volume')}</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {exercises.map(ex => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onDelete={handleExerciseDeleted}
                  onSetAdded={handleSetAdded}
                  onSetDeleted={handleSetDeleted}
                />
              ))}
            </div>

            {workout.finished_at && (
              <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-2xl px-4 py-3 text-brand-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Entreno completado</span>
                {workout.started_at && (
                  <span className="ml-auto text-xs text-zinc-500 font-normal">
                    {(() => {
                      const ms = new Date(workout.finished_at!).getTime() - new Date(workout.started_at).getTime()
                      const mins = Math.floor(ms / 60000)
                      const h = Math.floor(mins / 60)
                      return h > 0 ? `${h}h ${mins % 60}min` : `${mins} min`
                    })()}
                  </span>
                )}
                <button
                  onClick={handleDeleteWorkout}
                  className="ml-3 p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  title="Borrar entreno"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {exercises.length > 0 && !workout.finished_at && (
              <button
                onClick={() => setShowSummary(true)}
                className="w-full bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 hover:border-brand-500/50 text-brand-400 font-semibold rounded-2xl py-3 flex items-center justify-center gap-2 transition-all duration-150 touch-manipulation"
              >
                <CheckCircle className="w-4 h-4" />
                {t('today_page.finish_workout')}
              </button>
            )}

            <div className="flex flex-col gap-2">
              <button onClick={() => setShowAddExercise(true)}
                className="w-full border-2 border-dashed border-surface-border hover:border-brand/40 hover:bg-brand/5 rounded-2xl py-5 flex items-center justify-center gap-2 text-muted hover:text-brand transition-all duration-200 touch-manipulation group">
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-xs">{t('today_page.add_exercise')}</span>
              </button>

              {templates.length > 0 && !workout.finished_at && (
                <button
                  onClick={() => setShowTemplatePicker(true)}
                  className="w-full py-2 flex items-center justify-center gap-2 text-[10px] text-zinc-500 hover:text-brand-400 transition-colors uppercase tracking-widest font-bold opacity-60 hover:opacity-100"
                >
                  <LayoutTemplate className="w-3 h-3" />
                  {t('today_page.add_template')}
                </button>
              )}
            </div>
          </>
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
          onDeleted={id => setTemplates(prev => prev.filter(t => t.id !== id))}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      <BottomNav />
    </div>
  )
}