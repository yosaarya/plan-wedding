import 'server-only'
import { requireWedding } from '@/lib/auth/guards'
import { PAGE_SIZE } from '@/lib/constants'
import type { Guest, GuestGroup, InvitationStatus, PartySide, RsvpStatus, WeddingSettings } from '@/types/database'

export type GuestFilter = {
  q?: string
  rsvp?: RsvpStatus
  kirim?: InvitationStatus
  grup?: string
  pihak?: PartySide
  page?: number
}

export type GuestPage = {
  rows: Guest[]
  total: number
  page: number
  pageCount: number
}

/**
 * Daftar tamu, dipaginasi di server (aturan B6.1). Pencarian dan filter juga
 * dikerjakan database — 300+ baris tidak pernah dikirim utuh ke HP.
 */
export async function listGuests(filter: GuestFilter = {}): Promise<GuestPage> {
  const { supabase, weddingId } = await requireWedding()
  const page = Math.max(filter.page ?? 1, 1)
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('guests')
    .select('*', { count: 'exact' })
    .eq('wedding_id', weddingId)
    .is('deleted_at', null)

  if (filter.q) {
    // Pencarian nama memakai indeks trigram; nomor dicocokkan sebagai awalan.
    const term = filter.q.replace(/[%,]/g, ' ').trim()
    if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
  }
  if (filter.rsvp) query = query.eq('rsvp_status', filter.rsvp)
  if (filter.kirim) query = query.eq('invitation_status', filter.kirim)
  if (filter.grup) query = query.eq('group_id', filter.grup)
  if (filter.pihak) query = query.eq('side', filter.pihak)

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(from, from + PAGE_SIZE - 1)

  if (error) throw new Error(`Gagal membaca daftar tamu: ${error.message}`)

  const total = count ?? 0
  return {
    rows: (data ?? []) as Guest[],
    total,
    page,
    pageCount: Math.max(Math.ceil(total / PAGE_SIZE), 1),
  }
}

export async function listGuestGroups(): Promise<GuestGroup[]> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('guest_groups')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new Error(`Gagal membaca grup tamu: ${error.message}`)
  return (data ?? []) as GuestGroup[]
}

export async function getGuest(id: string): Promise<Guest | null> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', id)
    .eq('wedding_id', weddingId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new Error(`Gagal membaca data tamu: ${error.message}`)
  return (data as Guest | null) ?? null
}

export async function getWeddingSettings(): Promise<WeddingSettings | null> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('wedding_settings')
    .select('*')
    .eq('wedding_id', weddingId)
    .maybeSingle()

  if (error) throw new Error(`Gagal membaca pengaturan: ${error.message}`)
  return (data as WeddingSettings | null) ?? null
}
