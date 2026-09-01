import Link from 'next/link'

type Props = {
  value: number | string
  label: string
  /** Bila diisi, petak jadi tautan yang menerapkan filter terkait. */
  href?: string
}

/** Petak statistik: angka besar, label kecil (prinsip desain §1.2). */
export function StatTile({ value, label, href }: Props) {
  const content = (
    <>
      <span className="tabular block text-[22px] leading-7 font-bold text-ink-900">{value}</span>
      <span className="block text-xs leading-4 font-medium text-ink-500">{label}</span>
    </>
  )

  const className =
    'flex-1 rounded-xl bg-white px-2 py-3 text-center shadow-[var(--shadow-card)]'

  if (href) {
    return (
      <Link href={href} className={`${className} transition-colors hover:bg-cream-100`}>
        {content}
      </Link>
    )
  }
  return <div className={className}>{content}</div>
}
