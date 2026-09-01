'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireWedding } from '@/lib/auth/guards'

type Result = { error?: string; saved?: boolean }

const weddingSchema = z.object({
  groomName: z.string().trim().min(1, 'Nama belum diisi').max(80),
  brideName: z.string().trim().min(1, 'Nama belum diisi').max(80),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  totalBudget: z.coerce.number().int().min(0).max(100_000_000_000),
  invitationUrl: z.url('Tautan undangan tidak valid').optional().or(z.literal('')),
})

const eventSchema = z.object({
  name: z.string().trim().min(1, 'Nama acara belum diisi').max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  venueName: z.string().trim().max(120).optional().or(z.literal('')),
  venueAddress: z.string().trim().max(240).optional().or(z.literal('')),
})

const templateSchema = z.object({
  whatsappTemplate: z.string().trim().min(1, 'Template tidak boleh kosong').max(2000),
})

export async function updateWeddingSettings(formData: FormData): Promise<Result> {
  const parsed = weddingSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('weddings')
    .update({
      groom_name: input.groomName,
      bride_name: input.brideName,
      city: input.city || null,
      total_budget: input.totalBudget,
      invitation_url: input.invitationUrl || null,
    })
    .eq('id', weddingId)

  if (error) return { error: `Gagal menyimpan: ${error.message}` }

  revalidatePath('/', 'layout')
  return { saved: true }
}

/**
 * Mengubah acara utama. Mengubah tanggal hari-H TIDAK menggeser tenggat item
 * checklist yang sudah ada (aturan A2.5) — pergeseran itu harus jadi pilihan
 * eksplisit, bukan efek samping.
 */
export async function updatePrimaryEvent(formData: FormData): Promise<Result> {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const startsAt = `${input.date}T${input.time || '08:00'}:00+07:00`

  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('wedding_id', weddingId)
    .eq('is_primary', true)
    .maybeSingle()

  const payload = {
    name: input.name,
    starts_at: startsAt,
    venue_name: input.venueName || null,
    venue_address: input.venueAddress || null,
  }

  const { error } = existing
    ? await supabase.from('events').update(payload).eq('id', existing.id).eq('wedding_id', weddingId)
    : await supabase
        .from('events')
        .insert({ ...payload, wedding_id: weddingId, type: 'akad', is_primary: true })

  if (error) return { error: `Gagal menyimpan acara: ${error.message}` }

  revalidatePath('/', 'layout')
  return { saved: true }
}

export async function updateWhatsappTemplate(formData: FormData): Promise<Result> {
  const parsed = templateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('wedding_settings')
    .upsert(
      { wedding_id: weddingId, whatsapp_template: parsed.data.whatsappTemplate },
      { onConflict: 'wedding_id' },
    )

  if (error) return { error: `Gagal menyimpan template: ${error.message}` }

  revalidatePath('/tamu')
  revalidatePath('/profil')
  return { saved: true }
}
