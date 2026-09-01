'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updatePrimaryEvent } from '@/features/wedding/settings-actions'
import type { WeddingEvent } from '@/types/database'
import { SaveState } from './save-state'

const inputClass = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900'

/** Memisahkan timestamp menjadi tanggal dan jam versi WIB, untuk mengisi form. */
function pecah(startsAt: string | null): { date: string; time: string } {
  if (!startsAt) return { date: '', time: '' }

  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(startsAt))

  // sv-SE menghasilkan "2026-11-22 08:00"
  const [date = '', time = ''] = parts.split(' ')
  return { date, time }
}

export function EventForm({ event }: { event: WeddingEvent | null }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  const awal = pecah(event?.starts_at ?? null)

  async function action(formData: FormData) {
    setPending(true)
    setError(null)
    setSaved(false)

    const result = await updatePrimaryEvent(formData)
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setSaved(true)
    router.refresh()
  }

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm text-ink-700">
          Nama acara
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={120}
          defaultValue={event?.name ?? 'Akad Nikah'}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="date" className="mb-1 block text-sm text-ink-700">
            Tanggal
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={awal.date}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="time" className="mb-1 block text-sm text-ink-700">
            Jam
          </label>
          <input
            id="time"
            name="time"
            type="time"
            defaultValue={awal.time}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="venueName" className="mb-1 block text-sm text-ink-700">
          Lokasi
        </label>
        <input
          id="venueName"
          name="venueName"
          maxLength={120}
          defaultValue={event?.venue_name ?? ''}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="venueAddress" className="mb-1 block text-sm text-ink-700">
          Alamat lokasi
        </label>
        <input
          id="venueAddress"
          name="venueAddress"
          maxLength={240}
          defaultValue={event?.venue_address ?? ''}
          className={inputClass}
        />
      </div>

      <SaveState error={error} saved={saved} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : 'Simpan acara'}
      </button>
    </form>
  )
}
