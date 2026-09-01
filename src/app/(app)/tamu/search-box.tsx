'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/** Pencarian dikerjakan di server; input ini hanya menulis ke URL (aturan B6.1). */
export function SearchBox() {
  const router = useRouter()
  const params = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (value.trim()) next.set('q', value.trim())
      else next.delete('q')
      next.delete('page')

      const target = `/tamu${next.toString() ? `?${next}` : ''}`
      if (target !== `/tamu${params.toString() ? `?${params}` : ''}`) router.replace(target)
    }, 300)

    return () => clearTimeout(timer)
  }, [value, params, router])

  return (
    <label className="block">
      <span className="sr-only">Cari nama atau nomor tamu</span>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Cari nama atau nomor…"
        className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900"
      />
    </label>
  )
}
