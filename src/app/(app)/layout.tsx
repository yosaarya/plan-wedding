import { BottomNav } from '@/components/patterns/bottom-nav'
import { requireWedding } from '@/lib/auth/guards'

/**
 * Area terproteksi. Guard di sini memastikan setiap halaman di bawahnya
 * sudah punya sesi dan pernikahan aktif (arsitektur §6.3).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireWedding()

  return (
    <div className="min-h-dvh">
      {/* pb-22 menyisakan ruang untuk bottom nav setinggi 64px. */}
      <main className="mx-auto max-w-[480px] px-4 pb-22 pt-4">{children}</main>
      <BottomNav />
    </div>
  )
}
