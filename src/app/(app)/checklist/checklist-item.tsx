'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { toggleChecklistItem } from '@/features/checklist/actions'
import { LABEL_PJ, LABEL_PRIORITAS } from '@/features/checklist/lib'
import { formatTanggalPendek } from '@/lib/format/date'
import type { ChecklistItem as Item } from '@/types/database'

export function ChecklistItemRow({ item, late }: { item: Item; late: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Centang harus terasa instan — ini aksi paling sering dilakukan (aturan B6.6).
  const [done, setDone] = useOptimistic(item.is_done, (_prev, next: boolean) => next)

  function toggle() {
    setError(null)
    startTransition(async () => {
      setDone(!done)

      const form = new FormData()
      form.set('id', item.id)
      form.set('done', String(!done))

      const result = await toggleChecklistItem(form)
      if (result.error) setError(result.error)
    })
  }

  return (
    <li className="rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        {/* Target sentuh 44px meski kotaknya 24px (aksesibilitas §9). */}
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          onClick={toggle}
          className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <span
            aria-hidden
            className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm text-white ${
              done ? 'border-sage-500 bg-sage-500' : 'border-ink-300 bg-white'
            }`}
          >
            {done ? '✓' : ''}
          </span>
          <span className="sr-only">{item.title}</span>
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[15px] ${
              done ? 'text-ink-500 line-through' : 'font-medium text-ink-900'
            }`}
          >
            {item.title}
          </p>

          <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
            {item.due_date ? (
              <span className={late ? 'font-semibold text-[var(--color-danger)]' : ''}>
                {late ? 'Terlambat · ' : ''}
                {formatTanggalPendek(item.due_date)}
              </span>
            ) : null}
            {item.priority !== 'normal' ? <span>{LABEL_PRIORITAS[item.priority]}</span> : null}
            <span>{LABEL_PJ[item.assigned_to]}</span>
          </p>

          {item.notes ? <p className="mt-1 text-xs text-ink-700">{item.notes}</p> : null}
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
