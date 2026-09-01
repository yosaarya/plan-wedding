import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { StatTile } from '@/components/ui/stat-tile'
import { listGuestGroups, listGuests, getWeddingSettings } from '@/features/guests/queries'
import { getDashboardStats, getPrimaryEvent, getWedding } from '@/features/wedding/queries'
import type { InvitationStatus, PartySide, RsvpStatus } from '@/types/database'
import { FilterChips, type Chip } from './filter-chips'
import { GuestRow } from './guest-row'
import { SearchBox } from './search-box'

export const metadata = { title: 'Undangan — Persiapan Nikah' }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function TamuPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const one = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }

  const [wedding, event, stats, groups, settings, page] = await Promise.all([
    getWedding(),
    getPrimaryEvent(),
    getDashboardStats(),
    listGuestGroups(),
    getWeddingSettings(),
    listGuests({
      q: one('q'),
      rsvp: one('rsvp') as RsvpStatus | undefined,
      kirim: one('kirim') as InvitationStatus | undefined,
      grup: one('grup'),
      pihak: one('pihak') as PartySide | undefined,
      page: Number(one('page') ?? 1) || 1,
    }),
  ])

  const rsvpChips: Chip[] = [
    { key: 'rsvp', value: '', label: 'Semua status' },
    { key: 'rsvp', value: 'pending', label: `Pending ${stats.guest_pending}` },
    { key: 'rsvp', value: 'attending', label: 'Hadir' },
    { key: 'rsvp', value: 'not_attending', label: 'Tidak hadir' },
    { key: 'kirim', value: 'not_sent', label: 'Belum dikirim' },
  ]

  const groupChips: Chip[] = [
    { key: 'grup', value: '', label: 'Semua grup' },
    ...groups.map((group) => ({ key: 'grup', value: group.id, label: group.name })),
    { key: 'pihak', value: 'groom', label: wedding.groom_name },
    { key: 'pihak', value: 'bride', label: wedding.bride_name },
  ]

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const adaFilter = Boolean(one('q') || one('rsvp') || one('kirim') || one('grup') || one('pihak'))

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
          Daftar Undangan
        </h1>
        {/* "Undangan" dan "kepala" adalah dua angka berbeda (aturan A5.1). */}
        <p className="tabular text-xs text-ink-500">
          {stats.guest_invitations} undangan &middot; {stats.guest_headcount} kepala
        </p>
      </header>

      <div className="flex gap-2">
        <StatTile value={stats.guest_headcount} label="kepala" />
        {/* "Hadir" adalah jumlah orang, bukan jumlah baris (aturan A5.9). */}
        <StatTile value={stats.guest_attending_people} label="hadir" href="/tamu?rsvp=attending" />
        <StatTile value={stats.guest_invitations_sent} label="terkirim" href="/tamu?kirim=sent" />
        <StatTile value={stats.guest_pending} label="pending" href="/tamu?rsvp=pending" />
      </div>

      <SearchBox />
      <div className="space-y-2">
        <FilterChips chips={rsvpChips} />
        {groupChips.length > 3 ? <FilterChips chips={groupChips} /> : null}
      </div>

      {page.rows.length === 0 ? (
        adaFilter ? (
          <EmptyState
            title="Tidak ada tamu yang cocok"
            description="Coba ubah kata pencarian atau hapus filternya."
            action={
              <Link href="/tamu" className="text-sm font-semibold text-brand-600">
                Hapus semua filter
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Belum ada tamu"
            description="Tambahkan tamu untuk mulai menyebar undangan lewat WhatsApp, dan lacak siapa saja yang sudah konfirmasi."
            action={
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  href="/tamu/tambah"
                  className="rounded-full bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Tambah tamu
                </Link>
                <Link
                  href="/tamu/import"
                  className="rounded-full border border-brand-300 px-5 py-2.5 text-sm font-semibold text-brand-700"
                >
                  Tempel daftar nama
                </Link>
              </div>
            }
          />
        )
      ) : (
        <>
          <ul className="space-y-2">
            {page.rows.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                groomName={wedding.groom_name}
                brideName={wedding.bride_name}
                eventDate={event?.starts_at ?? null}
                template={settings?.whatsapp_template ?? ''}
                siteUrl={siteUrl}
              />
            ))}
          </ul>

          {page.pageCount > 1 ? (
            <nav aria-label="Halaman" className="flex items-center justify-between pt-2">
              <PageLink params={params} page={page.page - 1} disabled={page.page <= 1}>
                Sebelumnya
              </PageLink>
              <span className="tabular text-xs text-ink-500">
                Halaman {page.page} dari {page.pageCount}
              </span>
              <PageLink
                params={params}
                page={page.page + 1}
                disabled={page.page >= page.pageCount}
              >
                Berikutnya
              </PageLink>
            </nav>
          ) : null}
        </>
      )}

      <Link
        href="/tamu/tambah"
        aria-label="Tambah tamu"
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-2xl font-light text-white shadow-[var(--shadow-raised)]"
      >
        +
      </Link>
    </div>
  )
}

function PageLink({
  params,
  page,
  disabled,
  children,
}: {
  params: Record<string, string | string[] | undefined>
  page: number
  disabled: boolean
  children: React.ReactNode
}) {
  if (disabled) return <span className="text-xs text-ink-300">{children}</span>

  const next = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && key !== 'page') next.set(key, value)
  }
  next.set('page', String(page))

  return (
    <Link href={`/tamu?${next}`} className="text-xs font-semibold text-brand-600">
      {children}
    </Link>
  )
}
