import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** `accent` untuk kartu countdown; `outlined` untuk elemen di dalam kartu lain. */
  variant?: 'default' | 'accent' | 'outlined'
  className?: string
}

export function Card({ children, variant = 'default', className = '' }: Props) {
  const styles = {
    default: 'bg-white shadow-[var(--shadow-card)]',
    accent: 'bg-brand-50',
    outlined: 'bg-white border border-cream-200',
  }[variant]

  return <div className={`rounded-[var(--radius-card)] p-4 ${styles} ${className}`}>{children}</div>
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[18px] leading-[26px] font-bold text-ink-900">{title}</h2>
      {action}
    </div>
  )
}
