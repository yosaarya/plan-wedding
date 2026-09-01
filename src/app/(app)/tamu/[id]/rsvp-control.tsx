'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { setRsvp } from '@/features/guests/actions'
import { LABEL_RSVP } from '@/features/guests/lib'
import type { Guest, RsvpStatus } from '@/types/database'

const PILIHAN: RsvpStatus[] = ['pending', 'attending', 'not_attending', 'maybe']

export function RsvpControl({ guest }: { guest: Guest }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Perubahan status terasa instan; kalau gagal, nilai kembali ke data asli
  // dan pesan errornya muncul (aturan B6.6).
  const [optimistic, setOptimistic] = useOptimistic(
    { status: guest.rsvp_status, count: guest.attending_count },
    (_state, next: { status: RsvpStatus; count: number }) => next,
  )

  function simpan(status: RsvpStatus, count: number) {
    setError(null)
    startTransition(async () => {
      setOptimistic({ status, count })

      const form = new FormData()
      form.set('guestId', guest.id)
      form.set('status', status)
      form.set('attendingCount', String(count))

      const result = await setRsvp(form)
      if (result.error) setError(result.error)
    })
  }

  return (
    <section className="rounded-[var(--radius-card)] bg-white p-4 shadow-[var(--shadow-card)]">
      <h2 className="mb-3 text-[15px] font-bold text-ink-900">Status kehadiran</h2>

      <div className="flex flex-wrap gap-2">
        {PILIHAN.map((status) => {
          const active = optimistic.status === status
          return (
            <button
              key={status}
              type="button"
              disabled={isPending}
              onClick={() => simpan(status, status === 'attending' ? guest.headcount : 0)}
              aria-pressed={active}
              className={`h-9 rounded-full px-3 text-xs font-semibold disabled:opacity-60 ${
                active ? 'bg-brand-500 text-white' : 'border border-cream-200 bg-white text-ink-700'
              }`}
            >
              {LABEL_RSVP[status]}
            </button>
          )
        })}
      </div>

      {optimistic.status === 'attending' && guest.headcount > 1 ? (
        <div className="mt-4">
          <label htmlFor="attendingCount" className="mb-1 block text-sm text-ink-700">
            Berapa orang yang datang?
          </label>
          <select
            id="attendingCount"
            value={optimistic.count || guest.headcount}
            disabled={isPending}
            onChange={(event) => simpan('attending', Number(event.target.value))}
            className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900"
          >
            {Array.from({ length: guest.headcount }, (_, index) => index + 1).map((n) => (
              <option key={n} value={n}>
                {n} dari {guest.headcount} orang
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        Status kehadiran {guest.name}: {LABEL_RSVP[optimistic.status]}
      </p>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </section>
  )
}
