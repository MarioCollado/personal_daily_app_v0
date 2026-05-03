import { createClient } from './supabase-client'
import type { Workout, Exercise, Set, UserProfile, WorkoutWithExercises, WorkoutTemplate, TemplateExercise } from '../types'


export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function upsertUserProfile(userId: string, updates: Partial<Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserProfile> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      { user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getTodayWorkout(userId: string, targetDate?: string): Promise<Workout | null> {
  const supabase = createClient()
  
  // Create local iso date if none provided
  const d = new Date()
  const fallbackDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const date = targetDate || fallbackDate

  const { data } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()
  return data
}

export async function createWorkout(userId: string, date: string, name?: string): Promise<Workout> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: userId, date, name: name || null, started_at: null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWorkoutName(workoutId: string, name: string) {
  const supabase = createClient()
  await supabase.from('workouts').update({ name }).eq('id', workoutId)
}

export async function startWorkoutTimer(workoutId: string): Promise<string> {
  const supabase = createClient()
  const startedAt = new Date().toISOString()
  const { error } = await supabase
    .from('workouts')
    .update({ started_at: startedAt })
    .eq('id', workoutId)
    .is('started_at', null)

  if (error) throw error
  return startedAt
}

export async function resetWorkoutTimer(workoutId: string): Promise<string> {
  const supabase = createClient()
  const startedAt = new Date().toISOString()
  const { error } = await supabase
    .from('workouts')
    .update({ started_at: startedAt })
    .eq('id', workoutId)
    .is('finished_at', null)

  if (error) throw error
  return startedAt
}

export async function getWorkoutHistory(userId: string, limit = 20): Promise<Workout[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getRecentWorkoutsWithExercises(userId: string, days = 7): Promise<WorkoutWithExercises[]> {
  const supabase = createClient()
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: false })

  if (!workouts?.length) return []

  const workoutIds = workouts.map(workout => workout.id)
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*, sets(*)')
    .in('workout_id', workoutIds)
    .order('created_at', { ascending: true })

  const groupedExercises = new Map<string, Exercise[]>()

  for (const exercise of exercises || []) {
    const normalizedExercise: Exercise = {
      ...exercise,
      sets: (exercise.sets || []).sort((a: Set, b: Set) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }

    const bucket = groupedExercises.get(exercise.workout_id) || []
    bucket.push(normalizedExercise)
    groupedExercises.set(exercise.workout_id, bucket)
  }

  return workouts.map(workout => ({
    ...workout,
    exercises: groupedExercises.get(workout.id) || [],
  }))
}

export async function duplicateWorkout(sourceWorkoutId: string, userId: string, targetDate: string) {
  const supabase = createClient()
  const { data: newWorkout, error: wErr } = await supabase
    .from('workouts')
    .insert({ user_id: userId, date: targetDate, name: null })
    .select().single()
  if (wErr) throw wErr

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*, sets(*)')
    .eq('workout_id', sourceWorkoutId)

  for (const ex of (exercises || [])) {
    const { data: newEx } = await supabase
      .from('exercises')
      .insert({ workout_id: newWorkout.id, name: ex.name, muscle_group: ex.muscle_group })
      .select().single()
    if (newEx && ex.sets?.length) {
      await supabase.from('sets').insert(
        ex.sets.map((s: Set) => ({
          exercise_id: newEx.id,
          reps: s.reps,
          weight: s.weight,
          rir: s.rir,
          notes: s.notes,
        }))
      )
    }
  }
  return newWorkout
}

export async function getExercisesForWorkout(workoutId: string): Promise<Exercise[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('exercises')
    .select('*, sets(*)')
    .eq('workout_id', workoutId)
    .order('created_at', { ascending: true })
  return (data || []).map((ex) => ({
    ...ex,
    sets: (ex.sets || []).sort((a: Set, b: Set) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }))
}

export async function addExercise(workoutId: string, name: string, muscleGroup?: string): Promise<Exercise> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .insert({ workout_id: workoutId, name, muscle_group: muscleGroup || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExercise(exerciseId: string) {
  const supabase = createClient()
  await supabase.from('exercises').delete().eq('id', exerciseId)
}

export async function addSet(exerciseId: string, reps: number, weight: number, rir?: number, notes?: string, distanceKm?: number, durationSeconds?: number): Promise<Set> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sets')
    .insert({ exercise_id: exerciseId, reps, weight, rir: rir ?? null, notes: notes || null, distance_km: distanceKm ?? null, duration_seconds: durationSeconds ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSet(setId: string, updates: Partial<Pick<Set, 'reps' | 'weight' | 'rir' | 'notes'>>) {
  const supabase = createClient()
  await supabase.from('sets').update(updates).eq('id', setId)
}

export async function deleteSet(setId: string) {
  const supabase = createClient()
  await supabase.from('sets').delete().eq('id', setId)
}

export async function getExerciseHistory(userId: string, exerciseName: string, limit = 5) {
  const supabase = createClient()
  const { data } = await supabase
    .from('exercises')
    .select('*, sets(*), workouts!inner(date, user_id)')
    .eq('name', exerciseName)
    .eq('workouts.user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit * 3) // fetch extra to group

  if (!data) return []

  // Group by workout date
  const sessionMap = new Map<string, { date: string; sets: Set[] }>()
  for (const ex of data) {
    const date = (ex.workouts as any)?.date
    if (!date) continue
    if (!sessionMap.has(date)) sessionMap.set(date, { date, sets: [] })
    sessionMap.get(date)!.sets.push(...(ex.sets || []))
  }
  return Array.from(sessionMap.values()).slice(0, limit)
}

export async function getLastExerciseSession(
  userId: string,
  exerciseName: string,
  excludeWorkoutId?: string
): Promise<Set[]> {
  const supabase = createClient()
  let query = supabase
    .from('exercises')
    .select('workout_id, created_at, sets(*), workouts!inner(user_id)')
    .eq('name', exerciseName)
    .eq('workouts.user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12)

  if (excludeWorkoutId) {
    query = query.neq('workout_id', excludeWorkoutId)
  }

  const { data } = await query
  if (!data?.length) return []

  const match = data.find(exercise => Array.isArray(exercise.sets) && exercise.sets.length > 0)
  if (!match?.sets?.length) return []

  return [...match.sets].sort((a: Set, b: Set) => a.created_at.localeCompare(b.created_at))
}

export async function getExerciseNames(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('exercises')
    .select('name, workouts!inner(user_id)')
    .eq('workouts.user_id', userId)
  if (!data) return []
  const names = Array.from(new Set(data.map((e) => e.name as string)))
  return names.sort()
}

export async function finishWorkout(workoutId: string, durationMinutes?: number): Promise<void> {
  const supabase = createClient()
  const finishedAt = new Date()
  const updates: any = { finished_at: finishedAt.toISOString() }
  
  if (durationMinutes !== undefined && durationMinutes > 0) {
    updates.started_at = new Date(finishedAt.getTime() - durationMinutes * 60000).toISOString()
  }

  await supabase
    .from('workouts')
    .update(updates)
    .eq('id', workoutId)
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('workouts').delete().eq('id', workoutId)
}

// ─── Plantillas ───────────────────────────────────────────────

export async function getTemplates(userId: string): Promise<WorkoutTemplate[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('workout_templates')
    .select('*, template_exercises(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(6)
  return (data || []).map(t => ({
    ...t,
    exercises: (t.template_exercises || []).sort(
      (a: TemplateExercise, b: TemplateExercise) => a.order_index - b.order_index
    ),
  }))
}

export async function saveTemplate(
  userId:    string,
  name:      string,
  exercises: { name: string; muscle_group: string | null }[]
): Promise<WorkoutTemplate> {
  const supabase = createClient()
  const { data: template, error } = await supabase
    .from('workout_templates')
    .insert({ user_id: userId, name })
    .select()
    .single()
  if (error) throw error

  if (exercises.length > 0) {
    await supabase.from('template_exercises').insert(
      exercises.map((ex, i) => ({
        template_id:  template.id,
        name:         ex.name,
        muscle_group: ex.muscle_group,
        order_index:  i,
      }))
    )
  }
  return template
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('workout_templates').delete().eq('id', templateId)
}

export async function applyTemplate(
  workoutId:  string,
  templateId: string
): Promise<Exercise[]> {
  const supabase = createClient()
  const { data: templateExercises } = await supabase
    .from('template_exercises')
    .select('*')
    .eq('template_id', templateId)
    .order('order_index', { ascending: true })

  if (!templateExercises?.length) return []

  const { data: inserted } = await supabase
    .from('exercises')
    .insert(
      templateExercises.map((ex: TemplateExercise) => ({
        workout_id:   workoutId,
        name:         ex.name,
        muscle_group: ex.muscle_group,
      }))
    )
    .select()

  return (inserted || []).map((ex: Exercise) => ({ ...ex, sets: [] }))
}
