'use server'

import { revalidatePath } from 'next/cache'
import { requireWedding } from '@/lib/auth/guards'
import { categorySchema, checklistItemSchema, toggleSchema } from './schema'

type Result = { error?: string }

/**
 * Centang / batalkan satu item. `completed_at` diisi trigger database, bukan
 * dikirim dari sini (skema §13).
 */
export async function toggleChecklistItem(formData: FormData): Promise<Result> {
  const parsed = toggleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Permintaan tidak dikenali.' }

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('checklist_items')
    .update({ is_done: parsed.data.done })
    .eq('id', parsed.data.id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menyimpan: ${error.message}` }

  revalidateChecklistViews()
  return {}
}

export async function createChecklistItem(formData: FormData): Promise<Result> {
  const parsed = checklistItemSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase.from('checklist_items').insert({
    wedding_id: weddingId,
    category_id: input.categoryId || null,
    title: input.title,
    notes: input.notes || null,
    due_date: input.dueDate || null,
    priority: input.priority,
    assigned_to: input.assignedTo,
  })

  if (error) return { error: `Gagal menambah tugas: ${error.message}` }

  revalidateChecklistViews()
  return {}
}

export async function updateChecklistItem(id: string, formData: FormData): Promise<Result> {
  const parsed = checklistItemSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('checklist_items')
    .update({
      category_id: input.categoryId || null,
      title: input.title,
      notes: input.notes || null,
      due_date: input.dueDate || null,
      priority: input.priority,
      assigned_to: input.assignedTo,
    })
    .eq('id', id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menyimpan perubahan: ${error.message}` }

  revalidateChecklistViews()
  return {}
}

export async function deleteChecklistItem(id: string): Promise<Result> {
  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menghapus tugas: ${error.message}` }

  revalidateChecklistViews()
  return {}
}

export async function createChecklistCategory(formData: FormData): Promise<Result> {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }

  const { supabase, weddingId } = await requireWedding()

  const { data: last } = await supabase
    .from('checklist_categories')
    .select('sort_order')
    .eq('wedding_id', weddingId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('checklist_categories').insert({
    wedding_id: weddingId,
    name: parsed.data.name,
    sort_order: (last?.sort_order ?? 0) + 1,
  })

  if (error) return { error: `Gagal membuat kategori: ${error.message}` }

  revalidateChecklistViews()
  return {}
}

/** Progres checklist ikut tampil di beranda, jadi keduanya disegarkan (aturan B2.6). */
function revalidateChecklistViews() {
  revalidatePath('/checklist')
  revalidatePath('/beranda')
}
