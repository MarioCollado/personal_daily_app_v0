import { createClient } from './supabase-client'
import type {
  ArtItem,
  ArtSession,
  ArtDailyState,
  ArtSessionWithItem,
  TodayArtsSummary,
  ArtDiscipline,
  ArtItemStatus,
} from '../types'

// ─── Art Items ────────────────────────────────────────────────

export async function getArtItems(
  userId: string,
  filters?: { discipline?: ArtDiscipline; status?: ArtItemStatus }
): Promise<ArtItem[]> {
  const supabase = createClient()
  let query = supabase
    .from('art_items')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (filters?.discipline) query = query.eq('discipline', filters.discipline)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data } = await query
  return data || []
}

export async function getArtItem(userId: string, itemId: string): Promise<ArtItem | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('art_items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single()
  return data
}

export async function createArtItem(
  userId: string,
  payload: Omit<ArtItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<ArtItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('art_items')
    .insert({ user_id: userId, ...payload })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateArtItem(
  userId: string,
  itemId: string,
  updates: Partial<Omit<ArtItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ArtItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('art_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteArtItem(userId: string, itemId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('art_items').delete().eq('id', itemId).eq('user_id', userId)
}

export async function getArtItemProgress(userId: string, itemId: string): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase
    .from('art_sessions')
    .select('observation_units, practice_units')
    .eq('user_id', userId)
    .eq('art_item_id', itemId)

  if (!data) return 0
  // For books we mostly care about observation_units (pages read).
  // We'll sum both just in case, but usually it's observation.
  return data.reduce((sum, s) => sum + (s.observation_units ?? 0) + (s.practice_units ?? 0), 0)
}

// ─── Art Sessions ─────────────────────────────────────────────

export async function createOrUpdateArtSession(
  userId: string,
  payload: Omit<ArtSession, 'id' | 'user_id' | 'created_at'> & { id?: string }
): Promise<ArtSession> {
  const supabase = createClient()
  const { id, ...rest } = payload

  if (id) {
    const { data, error } = await supabase
      .from('art_sessions')
      .update(rest)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('art_sessions')
    .insert({ user_id: userId, ...rest })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteArtSession(userId: string, sessionId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('art_sessions').delete().eq('id', sessionId).eq('user_id', userId)
}

export async function getRecentArtSessions(
  userId: string,
  days = 7
): Promise<ArtSessionWithItem[]> {
  const supabase = createClient()
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const { data } = await supabase
    .from('art_sessions')
    .select('*, art_item:art_items(*)')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  return (data || []) as ArtSessionWithItem[]
}

// ─── Today Summary ────────────────────────────────────────────

export async function getTodayArtsSummary(
  userId: string,
  date: string
): Promise<TodayArtsSummary> {
  const supabase = createClient()

  const [sessionsResult, stateResult] = await Promise.all([
    supabase
      .from('art_sessions')
      .select('*, art_item:art_items(*)')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false }),
    supabase
      .from('art_daily_state')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single(),
  ])

  const sessions = (sessionsResult.data || []) as ArtSessionWithItem[]
  const dailyState = stateResult.data as ArtDailyState | null

  const totalObservationMinutes = sessions.reduce(
    (sum, s) => sum + (s.observation_minutes ?? 0),
    0
  )
  const totalPracticeMinutes = sessions.reduce(
    (sum, s) => sum + (s.practice_minutes ?? 0),
    0
  )
  const totalObservationUnits = sessions.reduce(
    (sum, s) => sum + (s.observation_units ?? 0),
    0
  )
  const totalPracticeUnits = sessions.reduce(
    (sum, s) => sum + (s.practice_units ?? 0),
    0
  )

  // Featured item: from daily state or most recently updated active session item
  let featuredItem: ArtItem | null = null
  if (dailyState?.featured_art_item_id) {
    const match = sessions.find(
      s => s.art_item?.id === dailyState.featured_art_item_id
    )
    featuredItem = match?.art_item ?? null
  }
  if (!featuredItem && sessions.length > 0) {
    featuredItem = sessions[0]?.art_item ?? null
  }

  return {
    sessions,
    totalObservationMinutes,
    totalPracticeMinutes,
    totalObservationUnits,
    totalPracticeUnits,
    dailyState,
    featuredItem,
  }
}

// ─── Stats ────────────────────────────────────────────────────

export async function getArtsStats(
  userId: string,
  range = 30
): Promise<{
  totalSessions: number
  totalObservationMinutes: number
  totalPracticeMinutes: number
  byDiscipline: Record<string, { sessions: number; observationMin: number; practiceMin: number }>
}> {
  const supabase = createClient()
  const since = new Date(Date.now() - range * 86400000).toISOString().split('T')[0]

  const { data } = await supabase
    .from('art_sessions')
    .select('*, art_item:art_items(discipline)')
    .eq('user_id', userId)
    .gte('date', since)

  const sessions = (data || []) as (ArtSession & { art_item?: { discipline: string } | null })[]

  const byDiscipline: Record<string, { sessions: number; observationMin: number; practiceMin: number }> = {}

  for (const s of sessions) {
    const disc = s.art_item?.discipline ?? 'other'
    if (!byDiscipline[disc]) byDiscipline[disc] = { sessions: 0, observationMin: 0, practiceMin: 0 }
    byDiscipline[disc].sessions++
    byDiscipline[disc].observationMin += s.observation_minutes ?? 0
    byDiscipline[disc].practiceMin += s.practice_minutes ?? 0
  }

  return {
    totalSessions: sessions.length,
    totalObservationMinutes: sessions.reduce((sum, s) => sum + (s.observation_minutes ?? 0), 0),
    totalPracticeMinutes: sessions.reduce((sum, s) => sum + (s.practice_minutes ?? 0), 0),
    byDiscipline,
  }
}

// ─── Daily State ─────────────────────────────────────────────

export async function upsertArtDailyState(
  userId: string,
  date: string,
  updates: Partial<Pick<ArtDailyState, 'arts_locked' | 'featured_art_item_id'>>
): Promise<ArtDailyState> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('art_daily_state')
    .upsert({ user_id: userId, date, ...updates }, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Migration Compatibility Helpers ─────────────────────────

/**
 * Migrate an existing daily_metrics reading entry to art_items + art_sessions.
 * Safe to call multiple times (uses upsert / checks existing data).
 */
export async function migrateLegacyReadingEntry(
  userId: string,
  opts: {
    bookTitle: string
    bookTotalPages?: number | null
    pagesRead?: number | null
    date: string
  }
): Promise<{ item: ArtItem; session: ArtSession | null }> {
  const supabase = createClient()

  // Find or create art_item for this book
  const { data: existing } = await supabase
    .from('art_items')
    .select('*')
    .eq('user_id', userId)
    .eq('discipline', 'book')
    .eq('title', opts.bookTitle)
    .maybeSingle()

  let item: ArtItem
  if (existing) {
    item = existing as ArtItem
    // Update total_units if we now have it and didn't before
    if (opts.bookTotalPages && !existing.total_units) {
      item = await updateArtItem(userId, item.id, {
        total_units: opts.bookTotalPages,
        unit_label: 'pages',
      })
    }
  } else {
    item = await createArtItem(userId, {
      discipline: 'book',
      title: opts.bookTitle,
      creator_name: null,
      format: null,
      total_units: opts.bookTotalPages ?? null,
      unit_label: opts.bookTotalPages ? 'pages' : null,
      status: 'active',
      started_on: null,
      completed_on: null,
      notes: null,
    })
  }

  // Create session for that date if pages were read
  let session: ArtSession | null = null
  if (opts.pagesRead && opts.pagesRead > 0) {
    session = await createOrUpdateArtSession(userId, {
      art_item_id: item.id,
      date: opts.date,
      observation_units: opts.pagesRead,
      observation_minutes: null,
      practice_units: null,
      practice_minutes: null,
      session_type: 'reading',
      effort: null,
      public_output: false,
      collaborative: false,
      notes: null,
    })
  }

  return { item, session }
}
