import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/guards'
import { OnboardingForm } from './onboarding-form'

export const metadata = { title: 'Mulai — Persiapan Nikah' }

export default async function OnboardingPage() {
  const { supabase, userId } = await requireSession()

  // Yang sudah punya pernikahan tidak perlu melihat halaman ini lagi.
  const { data } = await supabase
    .from('wedding_members')
    .select('wedding_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (data) redirect('/beranda')

  return (
    <main className="mx-auto min-h-dvh max-w-[480px] px-6 py-10">
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
        Selamat datang
      </h1>
      <p className="mb-6 text-sm text-ink-700">
        Empat pertanyaan singkat, lalu checklist kalian langsung terisi.
      </p>
      <OnboardingForm />
    </main>
  )
}
