'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { toggleSeserahanItem } from '@/features/seserahan/actions'
import { formatRupiah } from '@/lib/format/currency'
import type { SeserahanItem } from '@/types/database'

export function SeserahanItemRow({ item }: { item: SeserahanItem }) {
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [bought, setBought] = useOptimistic(item.is_purchased, (_prev, next: boolean) => next)

  function toggle() {
    setError(null)
    startTransition(async () => {
      setBought(!bought)

      const form = new FormData()
      form.set('id', item.id)
      form.set('purchased', String(!bought))

      const result = await toggleSeserahanItem(form)
      if (result.error) setError(result.error)
    })
  }

  const harga = item.actual_price ?? item.estimated_price

  return (
    <li className="rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={bought}
          onClick={toggle}
          className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <span
            aria-hidden
            className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm text-white ${
              bought ? 'border-sage-500 bg-sage-500' : 'border-ink-300 bg-white'
            }`}
          >
            {bought ? '✓' : ''}
          </span>
          <span className="sr-only">{item.name}</span>
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[15px] ${
              bought ? 'text-ink-500 line-through' : 'font-medium text-ink-900'
            }`}
          >
            {item.name}
            {item.quantity > 1 ? (
              <span className="tabular font-normal text-ink-500"> ×{item.quantity}</span>
            ) : null}
          </p>

          <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
            {harga !== null ? (
              <span className="tabular">
                {formatRupiah(harga)}
                {/* Harga hasil seed adalah perkiraan kasar (aturan A6.5). */}
                {item.actual_price === null ? ' (estimasi)' : ''}
              </span>
            ) : null}
            {item.product_url ? (
              <a
                href={item.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-600"
              >
                Lihat toko
              </a>
            ) : null}
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-2 pl-11 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </li>
  )
}
