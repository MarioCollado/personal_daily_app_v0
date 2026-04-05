export interface Workout {
  id: string
  user_id: string
  date: string        // ISO date 'YYYY-MM-DD'
  name: string | null
  created_at: string
}

export interface Exercise {
  id: string
  workout_id: string
  name: string
  muscle_group: string | null
  created_at: string
  sets?: Set[]
}

export interface Set {
  id: string
  exercise_id: string
  reps: number
  weight: number
  rir: number | null
  notes: string | null
  created_at: string
}

export interface ExerciseHistory {
  exercise_name: string
  sessions: {
    date: string
    sets: Set[]
  }[]
}
