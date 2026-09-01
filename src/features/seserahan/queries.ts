import 'server-only'
import { requireWedding } from '@/lib/auth/guards'
import type { SeserahanItem } from '@/types/database'

export async function listSeserahanItems(): Promise<SeserahanItem[]> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('seserahan_items')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal membaca daftar seserahan: ${error.message}`)
  return (data ?? []) as SeserahanItem[]
}
