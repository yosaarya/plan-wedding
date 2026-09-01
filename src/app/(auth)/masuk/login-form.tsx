'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
    })

    if (authError) {
      // Pesan error menyebutkan langkah berikutnya, bukan kode teknis (aturan C4).
      setError('Email atau password belum cocok. Coba periksa lagi.')
      setPending(false)
      return
    }

    router.replace(searchParams.get('next') ?? '/beranda')
    router.refresh()
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

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ink-900">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900"
        />
      </div>

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
        {pending ? 'Sebentar…' : 'Masuk'}
      </button>
    </form>
  )
}
