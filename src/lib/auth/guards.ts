import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { MemberRole } from '@/types/database'

/**
 * Guard yang dipakai di awal setiap Server Component terproteksi dan setiap
 * Server Action (aturan B2.3).
 */

export type SessionContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  email: string
}

export type WeddingContext = SessionContext & {
  weddingId: string
  role: MemberRole
}

/** Melempar ke halaman masuk bila tidak ada sesi. */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/masuk')

  return { supabase, userId: user.id, email: user.email ?? '' }
}

/**
 * Mengambil pernikahan aktif pengguna. Yang belum punya pernikahan diarahkan
 * ke onboarding.
 *
 * `weddingId` yang dikembalikan WAJIB dipakai sebagai filter eksplisit di
 * setiap kueri tabel domain, meskipun RLS sudah aktif (aturan B2.4).
 */
export async function requireWedding(): Promise<WeddingContext> {
  const session = await requireSession()

  const { data, error } = await session.supabase
    .from('wedding_members')
    .select('wedding_id, role')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Gagal membaca keanggotaan: ${error.message}`)
  if (!data) redirect('/onboarding')

  return { ...session, weddingId: data.wedding_id, role: data.role }
}

/** Untuk aksi yang hanya boleh dilakukan pemilik, mis. menghapus pernikahan. */
export async function requireOwner(): Promise<WeddingContext> {
  const context = await requireWedding()
  if (context.role !== 'owner') {
    throw new Error('Aksi ini hanya bisa dilakukan pemilik pernikahan.')
  }
  return context
}

/** Peran yang boleh mengubah data (aturan A1.3). */
export function isEditor(role: MemberRole): boolean {
  return role === 'owner' || role === 'partner'
}
