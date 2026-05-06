export interface Workout {
  id: string
  user_id: string
  date: string
  name: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export interface UserProfile {
  user_id: string
  weight: number | null
  height: number | null
  age: number | null
  created_at: string
  updated_at: string
}

export type ExerciseType = 'strength' | 'time' | 'cardio'

export interface Exercise {
  id: string
  workout_id: string
  name: string
  muscle_group: string | null
  type?: ExerciseType
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
  phone_usage: number | null   // 1-5: nivel de uso del móvil hoy (mayor = peor)
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

export interface WorkoutTemplate {
  id:         string
  user_id:    string
  name:       string
  created_at: string
  exercises?: TemplateExercise[]
}

export interface TemplateExercise {
  id:           string
  template_id:  string
  name:         string
  muscle_group: string | null
  order_index:  number
}

// ─── Arts Module ─────────────────────────────────────────────

export type ArtDiscipline =
  | 'music'
  | 'film'
  | 'painting'
  | 'photography'
  | 'book'
  | 'theater'
  | 'dance'
  | 'design'
  | 'writing'
  | 'other'

export type ArtItemStatus = 'planned' | 'active' | 'completed'

export interface ArtItem {
  id: string
  user_id: string
  discipline: ArtDiscipline
  title: string
  creator_name: string | null
  format: string | null
  total_units: number | null
  unit_label: string | null
  status: ArtItemStatus
  started_on: string | null
  completed_on: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ArtSession {
  id: string
  user_id: string
  art_item_id: string | null
  date: string
  // Observation axis (consuming/appreciating)
  observation_units: number | null
  observation_minutes: number | null
  // Practice axis (creating/rehearsing) — independent from observation
  practice_units: number | null
  practice_minutes: number | null
  session_type: string | null
  effort: number | null
  public_output: boolean
  collaborative: boolean
  notes: string | null
  created_at: string
}

export interface ArtDailyState {
  user_id: string
  date: string
  arts_locked: boolean
  featured_art_item_id: string | null
}

export interface ArtSessionWithItem extends ArtSession {
  art_item?: ArtItem | null
}

export interface TodayArtsSummary {
  sessions: ArtSessionWithItem[]
  totalObservationMinutes: number
  totalPracticeMinutes: number
  totalObservationUnits: number
  totalPracticeUnits: number
  dailyState: ArtDailyState | null
  featuredItem: ArtItem | null
}