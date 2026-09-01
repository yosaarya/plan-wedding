'use server'

import { revalidatePath } from 'next/cache'
import { requireWedding } from '@/lib/auth/guards'
import { parseDaftarTempel } from './lib'
import { guestSchema, importSchema, updateRsvpSchema } from './schema'

/** Pola wajib tiap aksi: validasi → otorisasi → tulis → revalidate (arsitektur §5). */

type Result = { error?: string; warning?: string }

export async function createGuest(formData: FormData): Promise<Result> {
  const parsed = guestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase.from('guests').insert({
    wedding_id: weddingId,
    name: input.name,
    phone: input.phone,
    address: input.address || null,
    side: input.side,
    group_id: input.groupId || null,
    headcount: input.headcount,
    note: input.note || null,
  })

  if (error) return { error: `Gagal menyimpan tamu: ${error.message}` }

  revalidateGuestViews()

  // Duplikat hanya diperingatkan, tidak menghalangi (aturan A5.5).
  if (input.phone) {
    const { count } = await supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('wedding_id', weddingId)
      .eq('phone', input.phone)
      .is('deleted_at', null)

    if ((count ?? 0) > 1) {
      return { warning: 'Nomor ini sudah dipakai tamu lain. Tersimpan, tapi coba dicek lagi.' }
    }
  }

  return {}
}

export async function updateGuest(id: string, formData: FormData): Promise<Result> {
  const parsed = guestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('guests')
    .update({
      name: input.name,
      phone: input.phone,
      address: input.address || null,
      side: input.side,
      group_id: input.groupId || null,
      headcount: input.headcount,
      note: input.note || null,
    })
    .eq('id', id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menyimpan perubahan: ${error.message}` }

  revalidateGuestViews()
  return {}
}

/** Hapus bersifat soft delete 30 hari; tokennya langsung tidak berlaku (aturan A5.13). */
export async function deleteGuest(id: string): Promise<Result> {
  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('guests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menghapus tamu: ${error.message}` }

  revalidateGuestViews()
  return {}
}

/**
 * Dipanggil setelah tombol WhatsApp ditekan (aturan A5.6). Status tetap bisa
 * diubah manual, jadi aksi ini tidak pernah menimpa status yang lebih maju.
 */
export async function markInvitationSent(id: string): Promise<Result> {
  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('guests')
    .update({
      invitation_status: 'sent',
      invitation_channel: 'whatsapp',
      invitation_sent_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('wedding_id', weddingId)
    .eq('invitation_status', 'not_sent')

  if (error) return { error: `Gagal menandai undangan terkirim: ${error.message}` }

  revalidateGuestViews()
  return {}
}

/** Mencatat RSVP dari sisi kami, mis. tamu yang mengabari lewat telepon. */
export async function setRsvp(formData: FormData): Promise<Result> {
  const parsed = updateRsvpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  // Batas atas tetap dijaga database lewat CHECK attending_count <= headcount
  // (aturan A5.8); di sini kita hanya memotong lebih awal agar pesannya ramah.
  const { data: guest } = await supabase
    .from('guests')
    .select('headcount')
    .eq('id', input.guestId)
    .eq('wedding_id', weddingId)
    .maybeSingle()

  if (!guest) return { error: 'Tamu tidak ditemukan.' }

  const { error } = await supabase
    .from('guests')
    .update({
      rsvp_status: input.status,
      attending_count: Math.min(input.attendingCount, guest.headcount),
      responded_at: new Date().toISOString(),
    })
    .eq('id', input.guestId)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menyimpan RSVP: ${error.message}` }

  revalidateGuestViews()
  return {}
}

/**
 * Import daftar nama yang ditempel (kebutuhan F4.12). Baris tanpa nama
 * dilewati (aturan A5.14).
 */
export async function importGuests(formData: FormData): Promise<Result & { imported?: number }> {
  const parsed = importSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }

  const rows = parseDaftarTempel(parsed.data.text)
  if (rows.length === 0) return { error: 'Tidak ada nama yang bisa dibaca.' }

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase.from('guests').insert(
    rows.map((row) => ({
      wedding_id: weddingId,
      name: row.name,
      headcount: row.headcount,
      group_id: parsed.data.groupId || null,
      side: parsed.data.side,
    })),
  )

  if (error) return { error: `Gagal mengimpor tamu: ${error.message}` }

  revalidateGuestViews()
  return { imported: rows.length }
}

export async function createGuestGroup(formData: FormData): Promise<Result> {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Nama grup belum diisi.' }

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase.from('guest_groups').insert({
    wedding_id: weddingId,
    name: name.slice(0, 80),
  })

  if (error) return { error: `Gagal membuat grup: ${error.message}` }

  revalidateGuestViews()
  return {}
}

/** Statistik tamu ikut berubah, jadi beranda perlu ikut disegarkan (aturan B2.6). */
function revalidateGuestViews() {
  revalidatePath('/tamu')
  revalidatePath('/beranda')
}
