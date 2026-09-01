'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updateWeddingSettings } from '@/features/wedding/settings-actions'
import type { Wedding } from '@/types/database'
import { SaveState } from './save-state'

const inputClass = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900'

export function WeddingForm({ wedding }: { wedding: Wedding }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    setError(null)
    setSaved(false)

    const result = await updateWeddingSettings(formData)
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
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="groomName" className="mb-1 block text-sm text-ink-700">
            Pengantin pria
          </label>
          <input
            id="groomName"
            name="groomName"
            required
            maxLength={80}
            defaultValue={wedding.groom_name}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="brideName" className="mb-1 block text-sm text-ink-700">
            Pengantin wanita
          </label>
          <input
            id="brideName"
            name="brideName"
            required
            maxLength={80}
            defaultValue={wedding.bride_name}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="city" className="mb-1 block text-sm text-ink-700">
          Kota
        </label>
        <input
          id="city"
          name="city"
          maxLength={80}
          defaultValue={wedding.city ?? ''}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="totalBudget" className="mb-1 block text-sm text-ink-700">
          Total budget (rupiah)
        </label>
        <input
          id="totalBudget"
          name="totalBudget"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          required
          defaultValue={wedding.total_budget}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="invitationUrl" className="mb-1 block text-sm text-ink-700">
          URL undangan digital <span className="text-ink-500">(boleh dikosongkan)</span>
        </label>
        <input
          id="invitationUrl"
          name="invitationUrl"
          type="url"
          placeholder="https://…"
          defaultValue={wedding.invitation_url ?? ''}
          className={inputClass}
        />
      </div>

      <SaveState error={error} saved={saved} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : 'Simpan'}
      </button>
    </form>
  )
}
