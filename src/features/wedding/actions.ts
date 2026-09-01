'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/guards'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import { onboardingSchema } from './schema'

/**
 * Mutasi. Pola wajib: validasi → otorisasi → tulis → revalidate
 * (arsitektur §5).
 */

export async function completeOnboarding(formData: FormData) {
  // 1. Validasi bentuk
  const parsed = onboardingSchema.safeParse({
    groomName: formData.get('groomName'),
    brideName: formData.get('brideName'),
    city: formData.get('city') ?? '',
    akadDate: formData.get('akadDate'),
    akadTime: formData.get('akadTime') ?? '',
    resepsiDate: formData.get('resepsiDate') ?? '',
    venueName: formData.get('venueName') ?? '',
    estimatedGuests: formData.get('estimatedGuests') || undefined,
    totalBudget: formData.get('totalBudget') || undefined,
  })

  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? 'Ada isian yang belum benar.' }
  }
  const input = parsed.data

  // 2. Otorisasi
  const { supabase, userId } = await requireSession()

  // Sudah pernah onboarding? Jangan buat pernikahan kedua (aturan A1.1).
  const { data: existing } = await supabase
    .from('wedding_members')
    .select('wedding_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (existing) redirect('/beranda')

  // 3. Tulis
  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .insert({
      owner_id: userId,
      groom_name: input.groomName,
      bride_name: input.brideName,
      city: input.city || null,
      timezone: DEFAULT_TIMEZONE,
      estimated_guests: input.estimatedGuests ?? null,
      total_budget: input.totalBudget ?? 0,
      onboarding_completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (weddingError || !wedding) {
    return { error: `Gagal menyimpan data pernikahan: ${weddingError?.message ?? ''}` }
  }

  const { error: memberError } = await supabase.from('wedding_members').insert({
    wedding_id: wedding.id,
    user_id: userId,
    role: 'owner',
    accepted_at: new Date().toISOString(),
  })

  if (memberError) return { error: `Gagal mendaftarkan anggota: ${memberError.message}` }

  // Akad adalah acara utama dan acuan countdown (aturan A2.2).
  const akadStartsAt = combineDateTime(input.akadDate, input.akadTime || '08:00')
  const events: Array<Record<string, unknown>> = [
    {
      wedding_id: wedding.id,
      type: 'akad',
      name: 'Akad Nikah',
      starts_at: akadStartsAt,
      venue_name: input.venueName || null,
      is_primary: true,
      sort_order: 1,
    },
  ]

  // Resepsi hanya dibuat bila tanggalnya berbeda dari akad (aturan A2.1).
  if (input.resepsiDate && input.resepsiDate !== input.akadDate) {
    events.push({
      wedding_id: wedding.id,
      type: 'resepsi',
      name: 'Resepsi',
      starts_at: combineDateTime(input.resepsiDate, '11:00'),
      venue_name: input.venueName || null,
      is_primary: false,
      sort_order: 2,
    })
  }

  const { error: eventError } = await supabase.from('events').insert(events)
  if (eventError) return { error: `Gagal menyimpan acara: ${eventError.message}` }

  // Seeding template checklist, kategori anggaran, dan seserahan (aturan A3.1).
  // Fungsi ini idempoten, jadi aman meski dipanggil dua kali.
  const { error: seedError } = await supabase.rpc('seed_wedding_defaults', {
    p_wedding_id: wedding.id,
  })
  if (seedError) return { error: `Gagal menyiapkan checklist: ${seedError.message}` }

  await supabase.from('profiles').update({ active_wedding_id: wedding.id }).eq('id', userId)

  // 4. Segarkan cache
  revalidatePath('/', 'layout')
  redirect('/beranda')
}

/**
 * Menggabungkan tanggal dan jam lokal menjadi timestamp dengan offset WIB.
 * Ditulis eksplisit supaya tidak bergantung pada zona waktu server (aturan A2.2).
 */
function combineDateTime(date: string, time: string): string {
  return `${date}T${time}:00+07:00`
}
