'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    setPending(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/masuk')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="w-full rounded-full border border-cream-200 px-5 py-3 text-sm font-semibold text-ink-700 disabled:opacity-60"
    >
      {pending ? 'Keluar…' : 'Keluar'}
    </button>
  )
}
