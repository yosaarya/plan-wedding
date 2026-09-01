'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ResetForm() {
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    const supabase = createClient()

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profil`,
    })

    // Selalu tampilkan pesan yang sama, berhasil atau tidak: membedakannya akan
    // memberi tahu orang luar email mana yang terdaftar.
    setSent(true)
    setPending(false)
  }

  if (sent) {
    return (
      <p role="status" className="rounded-xl bg-sage-50 p-4 text-sm text-sage-700">
        Kalau emailnya terdaftar, tautan masuk sudah dikirim. Cek juga folder spam.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-500 px-5 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Mengirim…' : 'Kirim tautan'}
      </button>
    </form>
  )
}
