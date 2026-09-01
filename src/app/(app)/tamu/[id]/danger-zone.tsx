'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteGuest } from '@/features/guests/actions'

/**
 * Aksi merusak diberi label eksplisit dan butuh konfirmasi (aturan C6).
 * Hapus bersifat soft delete 30 hari, jadi masih bisa dipulihkan lewat SQL
 * bila benar-benar salah pencet (aturan A5.13).
 */
export function DangerZone({ guestId, guestName }: { guestId: string; guestName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setPending(true)
    setError(null)

    const result = await deleteGuest(guestId)
    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }
    router.push('/tamu')
    router.refresh()
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-full border border-cream-200 px-5 py-3 text-sm font-semibold text-[var(--color-danger)]"
      >
        Hapus tamu ini
      </button>
    )
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-cream-200 bg-white p-4">
      <p className="mb-1 text-[15px] font-bold text-ink-900">Hapus {guestName}?</p>
      <p className="mb-4 text-sm text-ink-700">
        Undangannya ikut hilang dari daftar dan tautan RSVP-nya tidak berlaku lagi.
      </p>

      {error ? (
        <p role="alert" className="mb-3 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-full border border-cream-200 px-4 py-3 text-sm font-semibold text-ink-700"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="flex-1 rounded-full bg-[var(--color-danger)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Menghapus…' : 'Ya, hapus'}
        </button>
      </div>
    </div>
  )
}
