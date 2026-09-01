import { Suspense } from 'react'
import { LoginForm } from './login-form'

export const metadata = { title: 'Masuk — Persiapan Nikah' }

export default function MasukPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6 py-10">
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
        Persiapan Nikah
      </h1>
      <p className="mb-6 text-sm text-ink-700">Masuk untuk melanjutkan persiapan kalian.</p>
      {/* LoginForm membaca ?next= lewat useSearchParams, jadi ia butuh batas Suspense
          supaya sisa halaman tetap bisa di-prerender. */}
      <Suspense fallback={<p className="text-sm text-ink-500">Memuat…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
