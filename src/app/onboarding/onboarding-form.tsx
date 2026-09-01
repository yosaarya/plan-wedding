'use client'

import { useState } from 'react'
import { completeOnboarding } from '@/features/wedding/actions'

const inputClass =
  'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900'

export function OnboardingForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    setError(null)
    // Aksi mengalihkan halaman saat berhasil; ia hanya kembali saat gagal.
    const result = await completeOnboarding(formData)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="mb-2 text-[15px] font-bold text-ink-900">Siapa nama kalian?</legend>
        <div>
          <label htmlFor="groomName" className="mb-1 block text-sm text-ink-700">
            Calon pengantin pria
          </label>
          <input id="groomName" name="groomName" required maxLength={80} className={inputClass} />
        </div>
        <div>
          <label htmlFor="brideName" className="mb-1 block text-sm text-ink-700">
            Calon pengantin wanita
          </label>
          <input id="brideName" name="brideName" required maxLength={80} className={inputClass} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-[15px] font-bold text-ink-900">Kapan hari bahagianya?</legend>
        <div>
          <label htmlFor="akadDate" className="mb-1 block text-sm text-ink-700">
            Tanggal akad
          </label>
          <input id="akadDate" name="akadDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="akadTime" className="mb-1 block text-sm text-ink-700">
            Jam akad <span className="text-ink-500">(boleh dikosongkan)</span>
          </label>
          <input id="akadTime" name="akadTime" type="time" className={inputClass} />
        </div>
        <div>
          <label htmlFor="resepsiDate" className="mb-1 block text-sm text-ink-700">
            Tanggal resepsi <span className="text-ink-500">(kalau beda hari)</span>
          </label>
          <input id="resepsiDate" name="resepsiDate" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="city" className="mb-1 block text-sm text-ink-700">
            Kota
          </label>
          <input id="city" name="city" maxLength={80} className={inputClass} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-[15px] font-bold text-ink-900">Perkiraan kasar</legend>
        <div>
          <label htmlFor="estimatedGuests" className="mb-1 block text-sm text-ink-700">
            Berapa tamu? <span className="text-ink-500">(boleh diubah nanti)</span>
          </label>
          <input
            id="estimatedGuests"
            name="estimatedGuests"
            type="number"
            inputMode="numeric"
            min={0}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="totalBudget" className="mb-1 block text-sm text-ink-700">
            Total budget dalam rupiah
          </label>
          <input
            id="totalBudget"
            name="totalBudget"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="125000000"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-ink-500">
            Dipakai untuk membagi alokasi awal tiap kategori. Bisa diubah kapan saja.
          </p>
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-500 px-5 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Menyiapkan checklist kalian…' : 'Mulai'}
      </button>
    </form>
  )
}
