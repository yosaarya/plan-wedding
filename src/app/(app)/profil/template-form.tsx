'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updateWhatsappTemplate } from '@/features/wedding/settings-actions'
import { PLACEHOLDERS, buatVars, renderTemplate } from '@/lib/whatsapp/message'
import { SaveState } from './save-state'

export function TemplateForm({ template }: { template: string }) {
  const router = useRouter()
  const [value, setValue] = useState(template)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  // Pratinjau memakai fungsi render yang sama dengan yang dipakai tombol WA,
  // jadi yang terlihat di sini persis yang akan terkirim.
  const pratinjau = renderTemplate(
    value,
    buatVars({
      guestName: 'Panji',
      groomName: 'Agus',
      brideName: 'Siti',
      eventDate: '2026-11-22T01:00:00Z',
      rsvpUrl: 'https://contoh.id/rsvp/abc123',
    }),
  )

  async function action(formData: FormData) {
    setPending(true)
    setError(null)
    setSaved(false)

    const result = await updateWhatsappTemplate(formData)
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setSaved(true)
    router.refresh()
  }

  return (
    <form action={action} className="space-y-3">
      <label htmlFor="whatsappTemplate" className="sr-only">
        Template pesan WhatsApp
      </label>
      <textarea
        id="whatsappTemplate"
        name="whatsappTemplate"
        rows={8}
        required
        maxLength={2000}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm text-ink-900"
      />

      <p className="text-xs text-ink-500">
        Kata yang diganti otomatis:{' '}
        {PLACEHOLDERS.map((key) => (
          <code key={key} className="mr-1 rounded bg-cream-100 px-1">
            {`{${key}}`}
          </code>
        ))}
      </p>

      <div className="rounded-xl bg-cream-50 p-3">
        <p className="mb-1 text-xs font-semibold text-ink-700">Pratinjau</p>
        <p className="whitespace-pre-wrap text-sm text-ink-900">{pratinjau}</p>
      </div>

      <SaveState error={error} saved={saved} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : 'Simpan template'}
      </button>
    </form>
  )
}
