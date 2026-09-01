'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Tombol hapus dengan konfirmasi dua langkah (aturan C6).
 *
 * Dipakai untuk baris di dalam daftar. Untuk penghapusan yang lebih berat
 * (tamu, pernikahan) pakai dialog tersendiri yang menjelaskan akibatnya.
 */
export function DeleteButton({
  onDelete,
  label,
}: {
  onDelete: () => Promise<{ error?: string }>
  /** Nama benda yang dihapus, dipakai untuk label aksesibilitas. */
  label: string
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Hapus ${label}`}
        className="-m-2 flex h-10 w-10 shrink-0 items-center justify-center text-lg text-ink-300 hover:text-[var(--color-danger)]"
      >
        ×
      </button>
    )
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full px-2 py-1 text-xs font-semibold text-ink-700"
      >
        Batal
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await onDelete()
            if (result.error) {
              setError(result.error)
              setConfirming(false)
              return
            }
            router.refresh()
          })
        }
        className="rounded-full bg-[var(--color-danger)] px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? '…' : 'Hapus'}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
    </span>
  )
}
