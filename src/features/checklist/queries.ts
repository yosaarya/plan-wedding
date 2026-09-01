import 'server-only'
import { requireWedding } from '@/lib/auth/guards'
import type { ChecklistCategory, ChecklistItem } from '@/types/database'

export type CategoryProgress = {
  wedding_id: string
  category_id: string
  name: string
  icon: string | null
  sort_order: number
  total_items: number
  done_items: number
  progress_percent: number
}

/**
 * Seluruh item checklist sekaligus.
 *
 * Tidak dipaginasi, berbeda dari daftar tamu: jumlahnya ~50–200 baris dan
 * halaman ini memang menampilkan progres seluruh kategori (aturan B6.1 hanya
 * mewajibkan paginasi untuk daftar yang berpotensi panjang).
 */
export async function listChecklistItems(): Promise<ChecklistItem[]> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal membaca checklist: ${error.message}`)
  return (data ?? []) as ChecklistItem[]
}

export async function listChecklistCategories(): Promise<ChecklistCategory[]> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('checklist_categories')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal membaca kategori: ${error.message}`)
  return (data ?? []) as ChecklistCategory[]
}

/** Progres per kategori dihitung di SQL lewat view, bukan di JavaScript (aturan B6.2). */
export async function listCategoryProgress(): Promise<CategoryProgress[]> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('checklist_category_progress')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal membaca progres kategori: ${error.message}`)
  return (data ?? []) as CategoryProgress[]
}
