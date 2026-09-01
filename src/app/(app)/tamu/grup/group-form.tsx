'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { createGuestGroup } from '@/features/guests/actions'

export function GroupForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    setError(null)

    const result = await createGuestGroup(formData)
    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }

    formRef.current?.reset()
    setPending(false)
    router.refresh()
  }

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="name" className="sr-only">
          Nama grup baru
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder="Nama grup baru"
          className="flex-1 rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-sage-500 px-5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? '…' : 'Tambah'}
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </form>
  )
}
