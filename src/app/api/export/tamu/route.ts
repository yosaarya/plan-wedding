import { requireWedding } from '@/lib/auth/guards'
import { toCsv } from '@/lib/csv'
import { LABEL_KIRIM, LABEL_RSVP } from '@/features/guests/lib'
import { formatNomorTampilan } from '@/lib/whatsapp/phone'
import type { Guest, GuestGroup } from '@/types/database'

/**
 * Ekspor daftar tamu sebagai CSV (kebutuhan F4.13).
 *
 * Tidak dipaginasi: ini justru gunanya — mengambil semuanya sekaligus sebagai
 * cadangan. Jumlahnya beberapa ratus baris, masih jauh di bawah batas wajar.
 */
export async function GET() {
  const { supabase, weddingId } = await requireWedding()

  const [{ data: guests, error }, { data: groups }] = await Promise.all([
    supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', weddingId)
      .is('deleted_at', null)
      .order('name', { ascending: true }),
    supabase.from('guest_groups').select('*').eq('wedding_id', weddingId),
  ])

  if (error) {
    return new Response('Gagal membaca daftar tamu', { status: 500 })
  }

  const namaGrup = new Map((groups ?? []).map((g: GuestGroup) => [g.id, g.name]))

  const csv = toCsv(
    ['Nama', 'Nomor HP', 'Kepala', 'Grup', 'Pihak', 'Status undangan', 'Status RSVP', 'Jumlah hadir', 'Alamat', 'Catatan'],
    ((guests ?? []) as Guest[]).map((g) => [
      g.name,
      formatNomorTampilan(g.phone),
      g.headcount,
      g.group_id ? (namaGrup.get(g.group_id) ?? '') : '',
      { groom: 'Pria', bride: 'Wanita', both: 'Keduanya' }[g.side],
      LABEL_KIRIM[g.invitation_status],
      LABEL_RSVP[g.rsvp_status],
      g.rsvp_status === 'attending' ? g.attending_count : 0,
      g.address ?? '',
      g.note ?? '',
    ]),
  )

  const today = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="daftar-tamu-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
