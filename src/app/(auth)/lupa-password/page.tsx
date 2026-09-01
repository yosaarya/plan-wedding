import Link from 'next/link'
import { ResetForm } from './reset-form'

export const metadata = { title: 'Lupa password — Persiapan Nikah' }

export default function LupaPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6 py-10">
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
        Lupa password
      </h1>
      <p className="mb-6 text-sm text-ink-700">
        Kami kirimkan tautan masuk ke emailmu. Buka tautannya, lalu buat password baru.
      </p>

      <ResetForm />

      <Link href="/masuk" className="mt-6 text-center text-sm font-semibold text-brand-600">
        Kembali ke halaman masuk
      </Link>
    </main>
  )
}
