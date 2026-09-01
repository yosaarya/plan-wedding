import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatTanggalPanjang } from '@/lib/format/date'
import type { RsvpContext } from '@/types/database'
import { RsvpForm } from './rsvp-form'

export const metadata = { title: 'Konfirmasi Kehadiran' }

/**
 * Halaman PUBLIK, tanpa login.
 *
 * Ia tidak pernah menyentuh tabel `guests` secara langsung — hanya lewat RPC
 * `get_rsvp_context` yang mengembalikan kolom terbatas (aturan A5.11).
 */
export default async function RsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_rsvp_context', { p_token: token })
  if (error || !data) notFound()

  const ctx = data as RsvpContext

  return (
    <main className="mx-auto min-h-dvh max-w-[420px] px-6 py-12">
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm text-ink-700">Kepada</p>
        <p className="mb-6 font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
          {ctx.guest_name}
        </p>

        <p className="text-sm text-ink-700">Undangan pernikahan</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl leading-10 font-semibold text-brand-500">
          {ctx.groom_name} &amp; {ctx.bride_name}
        </h1>

        {ctx.event_starts_at ? (
          <p className="mt-4 text-ink-900">{formatTanggalPanjang(ctx.event_starts_at)}</p>
        ) : null}

        {ctx.venue_name ? (
          <p className="mt-1 text-sm text-ink-700">
            {ctx.venue_name}
            {ctx.venue_address ? <span className="block text-ink-500">{ctx.venue_address}</span> : null}
          </p>
        ) : null}

        {ctx.venue_maps_url ? (
          <a
            href={ctx.venue_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-brand-600"
          >
            Lihat lokasi di peta
          </a>
        ) : null}
      </div>

      <RsvpForm
        token={token}
        headcount={ctx.headcount}
        currentStatus={ctx.rsvp_status}
        currentCount={ctx.attending_count}
      />
    </main>
  )
}
