'use client'

import { useState } from 'react'
import { MAX_WISH_LENGTH } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { RsvpStatus } from '@/types/database'

export function RsvpForm({
  token,
  headcount,
  currentStatus,
  currentCount,
}: {
  token: string
  headcount: number
  currentStatus: RsvpStatus
  currentCount: number
}) {
  const [status, setStatus] = useState<RsvpStatus>(
    currentStatus === 'pending' ? 'attending' : currentStatus,
  )
  const [count, setCount] = useState(currentCount > 0 ? currentCount : headcount)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(currentStatus !== 'pending')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    // Menulis lewat RPC, bukan lewat tabel. Batas jumlah hadir tetap
    // ditegakkan di dalam fungsi database (aturan A5.8, A5.11).
    const supabase = createClient()
    const { error: rpcError } = await supabase.rpc('submit_rsvp', {
      p_token: token,
      p_status: status,
      p_count: status === 'attending' ? count : 0,
      p_message: message.trim() || null,
    })

    if (rpcError) {
      setError('Jawabannya belum tersimpan. Coba lagi sebentar ya.')
      setPending(false)
      return
    }

    setSaved(true)
    setPending(false)
  }

  if (saved) {
    return (
      <div role="status" className="rounded-[var(--radius-card)] bg-white p-6 text-center shadow-[var(--shadow-card)]">
        <p className="mb-1 text-[18px] font-bold text-ink-900">
          {status === 'attending' ? 'Terima kasih, sampai jumpa!' : 'Terima kasih atas kabarnya'}
        </p>
        <p className="text-sm text-ink-700">
          {status === 'attending'
            ? `Kami catat ${count} orang akan hadir.`
            : 'Doa restumu sudah lebih dari cukup buat kami.'}
        </p>
        <button
          type="button"
          onClick={() => setSaved(false)}
          className="mt-4 text-sm font-semibold text-brand-600"
        >
          Ubah jawaban
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)]"
    >
      <fieldset>
        <legend className="mb-3 text-[15px] font-bold text-ink-900">Bisa hadir?</legend>
        <div className="space-y-2">
          {(
            [
              ['attending', 'Ya, saya hadir'],
              ['not_attending', 'Maaf, berhalangan'],
              ['maybe', 'Belum bisa memastikan'],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${
                status === value ? 'border-brand-500 bg-brand-50' : 'border-cream-200'
              }`}
            >
              <input
                type="radio"
                name="status"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                className="h-4 w-4"
              />
              <span className="text-ink-900">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {status === 'attending' && headcount > 1 ? (
        <div className="mt-4">
          <label htmlFor="count" className="mb-1 block text-sm font-semibold text-ink-900">
            Berapa orang yang datang?
          </label>
          <select
            id="count"
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900"
          >
            {Array.from({ length: headcount }, (_, index) => index + 1).map((n) => (
              <option key={n} value={n}>
                {n} orang
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-4">
        <label htmlFor="message" className="mb-1 block text-sm font-semibold text-ink-900">
          Ucapan &amp; doa <span className="font-normal text-ink-500">(boleh dikosongkan)</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MAX_WISH_LENGTH))}
          rows={3}
          maxLength={MAX_WISH_LENGTH}
          className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900"
        />
        <p className="tabular mt-1 text-right text-xs text-ink-500">
          {message.length}/{MAX_WISH_LENGTH}
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-full bg-sage-500 px-5 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : 'Kirim konfirmasi'}
      </button>
    </form>
  )
}
