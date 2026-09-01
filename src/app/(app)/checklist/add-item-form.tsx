'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { createChecklistCategory, createChecklistItem } from '@/features/checklist/actions'
import type { ChecklistCategory } from '@/types/database'

const inputClass = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900'

export function AddItemForm({ categories }: { categories: ChecklistCategory[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    setError(null)

    const result = await createChecklistItem(formData)
    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }

    formRef.current?.reset()
    setPending(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-2xl font-light text-white shadow-[var(--shadow-raised)]"
        aria-label="Tambah tugas"
      >
        +
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 rounded-[var(--radius-card)] bg-white p-4 shadow-[var(--shadow-card)]"
    >
      <h2 className="text-[15px] font-bold text-ink-900">Tugas baru</h2>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm text-ink-700">
          Apa yang perlu dikerjakan?
        </label>
        <input id="title" name="title" required maxLength={200} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="dueDate" className="mb-1 block text-sm text-ink-700">
            Tenggat
          </label>
          <input id="dueDate" name="dueDate" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="priority" className="mb-1 block text-sm text-ink-700">
            Prioritas
          </label>
          <select id="priority" name="priority" defaultValue="normal" className={inputClass}>
            <option value="low">Rendah</option>
            <option value="normal">Normal</option>
            <option value="high">Tinggi</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm text-ink-700">
            Kategori
          </label>
          <select id="categoryId" name="categoryId" defaultValue="" className={inputClass}>
            <option value="">Tanpa kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={async () => {
              const name = window.prompt('Nama kategori baru')
              if (!name?.trim()) return
              const form = new FormData()
              form.set('name', name.trim())
              const result = await createChecklistCategory(form)
              if (result.error) setError(result.error)
              else router.refresh()
            }}
            className="mt-1 text-xs font-semibold text-brand-600"
          >
            + Kategori baru
          </button>
        </div>
        <div>
          <label htmlFor="assignedTo" className="mb-1 block text-sm text-ink-700">
            Siapa
          </label>
          <select id="assignedTo" name="assignedTo" defaultValue="both" className={inputClass}>
            <option value="both">Berdua</option>
            <option value="groom">Pria</option>
            <option value="bride">Wanita</option>
          </select>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-full border border-cream-200 px-4 py-3 text-sm font-semibold text-ink-700"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-full bg-sage-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Menyimpan…' : 'Tambah'}
        </button>
      </div>
    </form>
  )
}
