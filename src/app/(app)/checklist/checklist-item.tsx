'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useState, useTransition } from 'react'
import {
  deleteChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
} from '@/features/checklist/actions'
import { DeleteButton } from '@/components/ui/delete-button'
import { LABEL_PJ, LABEL_PRIORITAS } from '@/features/checklist/lib'
import { formatTanggalPendek } from '@/lib/format/date'
import type { ChecklistCategory, ChecklistItem as Item } from '@/types/database'

export function ChecklistItemRow({
  item,
  late,
  categories,
}: {
  item: Item
  late: boolean
  categories: ChecklistCategory[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
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
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            className={`block w-full text-left text-[15px] ${
              done ? 'text-ink-500 line-through' : 'font-medium text-ink-900'
            }`}
          >
            {item.title}
          </button>

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

        <DeleteButton label={`tugas ${item.title}`} onDelete={() => deleteChecklistItem(item.id)} />
      </div>

      {editing ? (
        <form
          action={async (formData) => {
            const result = await updateChecklistItem(item.id, formData)
            if (result.error) {
              setError(result.error)
              return
            }
            setEditing(false)
            router.refresh()
          }}
          className="mt-3 space-y-2 border-t border-cream-200 pt-3 pl-11"
        >
          <label className="block text-xs text-ink-500">
            Judul
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={item.title}
              className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-ink-500">
              Tenggat
              <input
                name="dueDate"
                type="date"
                defaultValue={item.due_date ?? ''}
                className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
              />
            </label>
            <label className="block text-xs text-ink-500">
              Prioritas
              <select
                name="priority"
                defaultValue={item.priority}
                className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
              >
                <option value="low">Rendah</option>
                <option value="normal">Normal</option>
                <option value="high">Tinggi</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-ink-500">
              Kategori
              <select
                name="categoryId"
                defaultValue={item.category_id ?? ''}
                className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
              >
                <option value="">Tanpa kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-ink-500">
              Siapa
              <select
                name="assignedTo"
                defaultValue={item.assigned_to}
                className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
              >
                <option value="both">Berdua</option>
                <option value="groom">Pria</option>
                <option value="bride">Wanita</option>
              </select>
            </label>
          </div>

          <label className="block text-xs text-ink-500">
            Catatan
            <textarea
              name="notes"
              rows={2}
              maxLength={1000}
              defaultValue={item.notes ?? ''}
              className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-full border border-cream-200 px-3 py-2 text-xs font-semibold text-ink-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 rounded-full bg-sage-500 px-3 py-2 text-xs font-semibold text-white"
            >
              Simpan
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 pl-11 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </li>
  )
}
