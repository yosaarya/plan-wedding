import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GuestForm } from '@/features/guests/components/guest-form'
import { getGuest, listGuestGroups } from '@/features/guests/queries'
import { getWedding } from '@/features/wedding/queries'
import { DangerZone } from './danger-zone'
import { RsvpControl } from './rsvp-control'

export const metadata = { title: 'Ubah tamu — Persiapan Nikah' }

export default async function DetailTamuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [guest, groups, wedding] = await Promise.all([
    getGuest(id),
    listGuestGroups(),
    getWedding(),
  ])

  if (!guest) notFound()

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link href="/tamu" aria-label="Kembali ke daftar tamu" className="text-brand-600">
          ←
        </Link>
        <h1 className="truncate font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
          {guest.name}
        </h1>
      </header>

      {/* Mencatat jawaban yang masuk lewat telepon atau ketemu langsung. */}
      <RsvpControl guest={guest} />

      <GuestForm
        guest={guest}
        groups={groups}
        groomName={wedding.groom_name}
        brideName={wedding.bride_name}
      />

      <DangerZone guestId={guest.id} guestName={guest.name} />
    </div>
  )
}
