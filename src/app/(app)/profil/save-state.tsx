'use client'

/** Umpan balik simpan yang seragam untuk seluruh form di halaman profil. */
export function SaveState({ error, saved }: { error: string | null; saved: boolean }) {
  if (error) {
    return (
      <p role="alert" className="text-sm text-[var(--color-danger)]">
        {error}
      </p>
    )
  }
  if (saved) {
    return (
      <p role="status" className="text-sm text-sage-700">
        Tersimpan.
      </p>
    )
  }
  return null
}
