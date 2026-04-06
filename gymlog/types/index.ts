export interface Workout {
  id: string
  user_id: string
  date: string
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
