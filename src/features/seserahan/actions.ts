'use server'

import { revalidatePath } from 'next/cache'
import { requireWedding } from '@/lib/auth/guards'
import { seserahanItemSchema, togglePurchasedSchema } from './schema'

type Result = { error?: string }

/**
 * Centang "sudah dibeli". Harga aktual opsional — kalau tidak diisi, ringkasan
 * memakai harga estimasi sebagai perkiraan terbaik.
 */
export async function toggleSeserahanItem(formData: FormData): Promise<Result> {
  const parsed = togglePurchasedSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Permintaan tidak dikenali.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('seserahan_items')
    .update({
      is_purchased: input.purchased,
      purchased_at: input.purchased ? new Date().toISOString() : null,
      // Membatalkan centang juga mengosongkan harga aktual, supaya ringkasan
      // tidak menghitung barang yang ternyata belum jadi dibeli.
      actual_price: input.purchased ? (input.actualPrice ?? null) : null,
    })
    .eq('id', input.id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menyimpan: ${error.message}` }

  revalidateSeserahanViews()
  return {}
}

export async function createSeserahanItem(formData: FormData): Promise<Result> {
  const parsed = seserahanItemSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase.from('seserahan_items').insert({
    wedding_id: weddingId,
    category: input.category,
    name: input.name,
    quantity: input.quantity,
    estimated_price: input.estimatedPrice ?? null,
    product_url: input.productUrl || null,
    note: input.note || null,
  })

  if (error) return { error: `Gagal menambah barang: ${error.message}` }

  revalidateSeserahanViews()
  return {}
}

export async function deleteSeserahanItem(id: string): Promise<Result> {
  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('seserahan_items')
    .delete()
    .eq('id', id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menghapus barang: ${error.message}` }

  revalidateSeserahanViews()
  return {}
}

function revalidateSeserahanViews() {
  revalidatePath('/seserahan')
  revalidatePath('/beranda')
}
