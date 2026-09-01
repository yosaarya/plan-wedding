import { BUDGET_WARNING_PERCENT } from '@/lib/constants'

type Props = {
  /** 0–100. Nilai di atas 100 sengaja tidak dipotong agar over budget terlihat. */
  percent: number
  label: string
}

/**
 * Warna mengikuti ambang: normal, mendekati batas, lalu terlampaui
 * (aturan A4.7). Warna tidak pernah jadi satu-satunya penanda — selalu
 * ada label persentase di sebelahnya (aturan aksesibilitas §9).
 */
export function ProgressBar({ percent, label }: Props) {
  const clamped = Math.min(Math.max(percent, 0), 100)
  const color =
    percent > 100
      ? 'bg-[var(--color-danger)]'
      : percent >= BUDGET_WARNING_PERCENT
        ? 'bg-[var(--color-warning)]'
        : 'bg-brand-500'

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-cream-200"
    >
      <div className={`h-full rounded-full transition-[width] duration-400 ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}
