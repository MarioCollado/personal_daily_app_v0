export interface Workout {
  id: string
  user_id: string
  date: string
  name: string | null
  created_at: string
}

export interface UserProfile {
  user_id: string
  weight: number | null
  height: number | null
  age: number | null
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  workout_id: string
  name: string
  muscle_group: string | null
  created_at: string
  sets?: Set[]
}

export interface WorkoutWithExercises extends Workout {
  exercises: Exercise[]
}

// is_cardio: true = store distance_km + duration_seconds instead of reps/weight
export interface Set {
  id: string
  exercise_id: string
  reps: number
  weight: number
  rir: number | null
  notes: string | null
  // Cardio fields (nullable for strength sets)
  distance_km: number | null
  duration_seconds: number | null
  created_at: string
}

export interface DailyMetrics {
  id: string
  user_id: string
  date: string
  sleep_hours: number | null
  energy: number | null
  stress: number | null
  motivation: number | null
  book_title: string | null
  pages_read: number | null
  book_total_pages: number | null
  free_time: number | null   // 1-5: cuánto tiempo libre tuviste hoy
  reading_locked: boolean | null
  workout_locked: boolean | null
  weather_temp: number | null
  weather_condition: string | null
  created_at: string
  updated_at: string
}

export interface WeatherData {
  temp: number
  condition: string
  icon: string
  city: string
}

export interface RecipeMock {
  id: string
  name: string
  calories: number
  prepMinutes: number
  protein: number
  tags: string[]
  emoji: string
}

export interface IngredientMock {
  name: string
  amount: string
  emoji: string
}
