'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export type Chip = { key: string; value: string; label: string }

/**
 * Baris chip yang bisa digeser horizontal. Setiap chip mengubah satu parameter
 * URL, sehingga filter bisa dibagikan lewat tautan dan bertahan saat halaman
 * dimuat ulang.
 */
export function FilterChips({ chips }: { chips: Chip[] }) {
  const pathname = usePathname()
  const params = useSearchParams()

  function hrefFor(chip: Chip) {
    const next = new URLSearchParams(params.toString())
    if (chip.value === '') next.delete(chip.key)
    else next.set(chip.key, chip.value)
    // Filter baru selalu kembali ke halaman pertama.
    next.delete('page')
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex w-max gap-2 pb-1">
        {chips.map((chip) => {
          const current = params.get(chip.key) ?? ''
          const active = current === chip.value
          return (
            <Link
              key={`${chip.key}:${chip.value}:${chip.label}`}
              href={hrefFor(chip)}
              aria-current={active ? 'true' : undefined}
              className={`flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-semibold ${
                active ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 border border-cream-200'
              }`}
            >
              {chip.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
