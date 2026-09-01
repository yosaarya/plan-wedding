import 'server-only'
import { requireWedding } from '@/lib/auth/guards'
import type { DashboardStats, Wedding, WeddingEvent } from '@/types/database'

/**
 * Baca data. Hanya dipanggil dari Server Component (aturan B2.1).
 * Setiap kueri menyertakan filter wedding_id eksplisit meski RLS aktif (aturan B2.4).
 */

export async function getWedding(): Promise<Wedding> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .eq('id', weddingId)
    .single()

  if (error) throw new Error(`Gagal membaca data pernikahan: ${error.message}`)
  return data as Wedding
}

/** Acara utama — acuan countdown (aturan A2.2). */
export async function getPrimaryEvent(): Promise<WeddingEvent | null> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('wedding_id', weddingId)
    .eq('is_primary', true)
    .maybeSingle()

  if (error) throw new Error(`Gagal membaca acara: ${error.message}`)
  return (data as WeddingEvent | null) ?? null
}

/**
 * Seluruh statistik beranda dalam satu round-trip lewat view.
 * Agregasi uang dan hitungan tamu dilakukan di SQL, bukan di JavaScript
 * (aturan A4.10, A5.9, B6.2).
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('wedding_dashboard_stats')
    .select('*')
    .eq('wedding_id', weddingId)
    .single()

  if (error) throw new Error(`Gagal membaca ringkasan: ${error.message}`)
  return data as DashboardStats
}
