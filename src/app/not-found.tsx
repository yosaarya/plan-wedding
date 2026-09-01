import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink-900">
        Halaman tidak ditemukan
      </h1>
      <p className="mb-6 text-sm text-ink-700">
        Tautannya mungkin salah ketik atau sudah tidak berlaku.
      </p>
      <Link href="/beranda" className="rounded-full bg-sage-500 px-5 py-3 font-semibold text-white">
        Ke beranda
      </Link>
    </main>
  )
}
