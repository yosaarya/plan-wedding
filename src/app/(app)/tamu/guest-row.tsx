'use client'

import { useState, useTransition } from 'react'
import { markInvitationSent } from '@/features/guests/actions'
import { buatTautanRsvp, inisial, KELAS_BADGE_RSVP, LABEL_RSVP } from '@/features/guests/lib'
import { buatTautanWhatsApp, buatVars, renderTemplate } from '@/lib/whatsapp/message'
import type { Guest } from '@/types/database'

type Props = {
  guest: Guest
  groomName: string
  brideName: string
  eventDate: string | null
  template: string
  siteUrl: string
}

export function GuestRow({ guest, groomName, brideName, eventDate, template, siteUrl }: Props) {
  const [sent, setSent] = useState(guest.invitation_status !== 'not_sent')
  const [, startTransition] = useTransition()

  const pesan = renderTemplate(template,
    buatVars({
      guestName: guest.name,
      groomName,
      brideName,
      eventDate,
      rsvpUrl: buatTautanRsvp(guest.rsvp_token, siteUrl),
    }),
  )
  const waUrl = buatTautanWhatsApp(guest.phone, pesan)

  function handleKirim() {
    // Optimistic: tandai terkirim seketika, karena WhatsApp terbuka di tab lain
    // dan pengguna belum tentu kembali ke sini (aturan B6.6).
    setSent(true)
    startTransition(() => {
      void markInvitationSent(guest.id)
    })
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-card)]">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700"
      >
        {inisial(guest.name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink-900">{guest.name}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
          <span className="tabular">{guest.headcount} pax</span>
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${KELAS_BADGE_RSVP[guest.rsvp_status]}`}
          >
            {LABEL_RSVP[guest.rsvp_status]}
            {guest.rsvp_status === 'attending' ? ` · ${guest.attending_count}` : ''}
          </span>
          {sent ? <span className="text-sage-700">Terkirim</span> : null}
        </p>
      </div>

      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleKirim}
          aria-label={`Kirim undangan WhatsApp ke ${guest.name}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-50 text-xs font-bold text-sage-700"
        >
          WA
        </a>
      ) : (
        <span
          title="Nomor HP belum diisi atau belum dikenali"
          aria-label="Tombol WhatsApp nonaktif karena nomor HP belum ada"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-100 text-xs font-bold text-ink-300"
        >
          WA
        </span>
      )}
    </li>
  )
}
