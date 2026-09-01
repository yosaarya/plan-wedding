import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { listBudgetCategories, listCategorySummary, listExpenses } from '@/features/budget/queries'
import { belumDialokasikan, KELAS_STATUS, LABEL_STATUS, statusBayar } from '@/features/budget/lib'
import { getDashboardStats } from '@/features/wedding/queries'
import { formatRupiah, formatRupiahShort } from '@/lib/format/currency'
import { formatTanggalPendek } from '@/lib/format/date'
import { AddExpenseForm } from './add-expense-form'

export const metadata = { title: 'Anggaran — Persiapan Nikah' }

export default async function AnggaranPage() {
  const [stats, summary, categories, expenses] = await Promise.all([
    getDashboardStats(),
    listCategorySummary(),
    listBudgetCategories(),
    listExpenses(),
  ])

  const percent =
    stats.budget_total > 0 ? (stats.budget_spent / stats.budget_total) * 100 : 0
  const sisaAlokasi = belumDialokasikan(stats.budget_total, stats.budget_planned)

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
          Anggaran
        </h1>
      </header>

      <Card>
        <p className="tabular text-[22px] leading-7 font-bold text-ink-900">
          {formatRupiah(stats.budget_spent)}
        </p>
        <p className="tabular mb-3 text-xs text-ink-500">
          terpakai dari {formatRupiah(stats.budget_total)}
        </p>

        <ProgressBar percent={percent} label={`Pemakaian anggaran ${Math.round(percent)} persen`} />

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {/* "Terpakai" dan "terbayar" sengaja dipisah — ini pembeda utama dari
              aplikasi catatan biasa (aturan A4.3). */}
          <div>
            <dt className="text-xs text-ink-500">Sudah dibayar</dt>
            <dd className="tabular font-semibold text-ink-900">
              {formatRupiah(stats.budget_paid)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Masih harus dibayar</dt>
            <dd className="tabular font-semibold text-ink-900">
              {formatRupiah(stats.budget_spent - stats.budget_paid)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Sisa budget</dt>
            <dd
              className={`tabular font-semibold ${
                stats.budget_remaining < 0 ? 'text-[var(--color-danger)]' : 'text-ink-900'
              }`}
            >
              {stats.budget_remaining < 0
                ? `Over ${formatRupiah(Math.abs(stats.budget_remaining))}`
                : formatRupiah(stats.budget_remaining)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Belum dialokasikan</dt>
            <dd className="tabular font-semibold text-ink-900">{formatRupiah(sisaAlokasi)}</dd>
          </div>
        </dl>
      </Card>

      <section>
        <h2 className="mb-2 px-1 text-[15px] font-bold text-ink-900">Per kategori</h2>
        {summary.length === 0 ? (
          <EmptyState
            title="Belum ada kategori"
            description="Kategori anggaran biasanya terisi otomatis saat onboarding."
          />
        ) : (
          <ul className="space-y-2">
            {summary.map((category) => (
              <li
                key={category.category_id}
                className="rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)]"
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="truncate text-[15px] font-semibold text-ink-900">
                    {category.name}
                  </span>
                  <span
                    className={`tabular shrink-0 text-xs ${
                      category.is_over ? 'font-semibold text-[var(--color-danger)]' : 'text-ink-500'
                    }`}
                  >
                    {formatRupiahShort(category.spent_amount)}
                    {category.planned_amount > 0
                      ? ` / ${formatRupiahShort(category.planned_amount)}`
                      : ''}
                  </span>
                </div>
                <ProgressBar
                  percent={category.usage_percent}
                  label={`${category.name}: terpakai ${category.usage_percent} persen dari alokasi`}
                />
                {category.is_over ? (
                  <p className="mt-1 text-xs font-semibold text-[var(--color-danger)]">
                    Melebihi alokasi {formatRupiah(category.spent_amount - category.planned_amount)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[15px] font-bold text-ink-900">Pengeluaran terbaru</h2>
        {expenses.rows.length === 0 ? (
          <EmptyState
            title="Belum ada pengeluaran"
            description="Catat pengeluaran pertama lewat tombol di kanan bawah, supaya sisa budget selalu akurat."
          />
        ) : (
          <ul className="space-y-2">
            {expenses.rows.map((expense) => {
              const status = statusBayar(expense.amount, expense.paid_amount)
              return (
                <li
                  key={expense.id}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-ink-900">
                      {expense.title}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                      <span>{formatTanggalPendek(expense.transaction_date)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${KELAS_STATUS[status]}`}
                      >
                        {LABEL_STATUS[status]}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-[15px] font-semibold text-ink-900">
                      {formatRupiah(expense.amount)}
                    </p>
                    {status === 'dp' ? (
                      <p className="tabular text-xs text-ink-500">
                        dibayar {formatRupiahShort(expense.paid_amount)}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <AddExpenseForm categories={categories} />
    </div>
  )
}
