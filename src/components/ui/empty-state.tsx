import type { ReactNode } from 'react'

/**
 * Keadaan kosong wajib ada di setiap daftar, dan wajib menjelaskan manfaat
 * plus memberi satu jalan keluar (Definition of Done butir 2).
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-cream-200 bg-white px-6 py-10 text-center">
      <div
        aria-hidden
        className="mx-auto mb-4 h-12 w-12 rounded-full bg-blush-200"
      />
      <h3 className="mb-1 text-[18px] leading-[26px] font-bold text-ink-900">{title}</h3>
      <p className="mx-auto mb-4 max-w-[36ch] text-sm text-ink-700">{description}</p>
      {action}
    </div>
  )
}
