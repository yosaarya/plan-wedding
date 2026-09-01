import type { Guest, InvitationStatus, RsvpStatus } from '@/types/database'

/**
 * Logika murni modul tamu — tanpa React, tanpa Supabase, sehingga bisa diuji
 * tanpa mock (aturan B2.5).
 */

export function buatTautanRsvp(token: string, siteUrl?: string): string {
  const base = (siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '')
  return `${base}/rsvp/${token}`
}

export const LABEL_RSVP: Record<RsvpStatus, string> = {
  pending: 'Pending',
  attending: 'Hadir',
  not_attending: 'Tidak hadir',
  maybe: 'Mungkin',
}

export const LABEL_KIRIM: Record<InvitationStatus, string> = {
  not_sent: 'Belum dikirim',
  sent: 'Sudah dikirim',
  opened: 'Sudah dibuka',
}

/**
 * Warna badge status. Warna tidak pernah jadi satu-satunya penanda —
 * label teks selalu ikut ditampilkan (desain §2.3).
 */
export const KELAS_BADGE_RSVP: Record<RsvpStatus, string> = {
  pending: 'bg-cream-200 text-ink-700',
  attending: 'bg-sage-50 text-sage-700',
  not_attending: 'bg-cream-100 text-ink-500',
  maybe: 'bg-brand-50 text-brand-700',
}

/** Huruf awal untuk avatar. Menangani nama kosong tanpa melempar. */
export function inisial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

/**
 * Jumlah orang yang datang, dihitung dari sudut pandang satu tamu.
 * Hanya berarti bila statusnya `attending` (aturan A5.8).
 */
export function orangHadir(guest: Pick<Guest, 'rsvp_status' | 'attending_count'>): number {
  return guest.rsvp_status === 'attending' ? guest.attending_count : 0
}

/**
 * Mendeteksi nomor yang sudah dipakai tamu lain. Duplikat hanya memicu
 * peringatan, bukan penolakan — beberapa tamu memang berbagi nomor keluarga
 * (aturan A5.5).
 */
export function cariNomorKembar(
  phone: string | null,
  existing: Array<Pick<Guest, 'id' | 'name' | 'phone'>>,
  ignoreId?: string,
): Array<Pick<Guest, 'id' | 'name' | 'phone'>> {
  if (!phone) return []
  return existing.filter((g) => g.phone === phone && g.id !== ignoreId)
}

/**
 * Membaca daftar nama yang ditempel pengguna, satu nama per baris
 * (kebutuhan F4.12). Format opsional: `Nama, jumlah` — mis. "Panji, 2".
 * Baris kosong dilewati (aturan A5.14).
 */
export type BarisImport = { name: string; headcount: number }

export function parseDaftarTempel(text: string): BarisImport[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = line.match(/^(.*?)[,;]\s*(\d+)\s*$/)
      if (match?.[1] && match[2]) {
        const name = match[1].trim()
        const count = Number(match[2])
        if (name) return { name, headcount: count > 0 ? count : 1 }
      }
      return { name: line, headcount: 1 }
    })
    .filter((row) => row.name.length > 0)
}
