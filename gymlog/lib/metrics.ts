import { createClient } from './supabase-client'
import type { DailyMetrics } from '../types'

export async function getDailyMetrics(userId: string, date: string): Promise<DailyMetrics | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()
  return data
}

export async function upsertDailyMetrics(
  userId: string,
  date: string,
  updates: Partial<Omit<DailyMetrics, 'id' | 'user_id' | 'date' | 'created_at' | 'updated_at'>>
): Promise<DailyMetrics> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('daily_metrics')
    .upsert(
      { user_id: userId, date, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

// Reading history — pages per book accumulated
export async function getBookHistory(userId: string, bookTitle: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('daily_metrics')
    .select('date, pages_read, book_title')
    .eq('user_id', userId)
    .eq('book_title', bookTitle)
    .order('date', { ascending: true })
  return data || []
}

// All books the user has tracked
export async function getUserBooks(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('daily_metrics')
    .select('book_title')
    .eq('user_id', userId)
    .not('book_title', 'is', null)
  if (!data) return []
  return Array.from(new Set(data.map(d => d.book_title as string).filter(Boolean))).sort()
}

// Last N days of metrics for dashboard sparklines
export async function getRecentMetrics(userId: string, days = 14): Promise<DailyMetrics[]> {
  const supabase = createClient()
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
  const { data } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: false })
  return data || []
}
