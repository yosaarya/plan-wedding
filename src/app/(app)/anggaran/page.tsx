import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { listBudgetCategories, listCategorySummary, listExpenses } from '@/features/budget/queries'
import { belumDialokasikan } from '@/features/budget/lib'
import { getDashboardStats } from '@/features/wedding/queries'
import { formatRupiah } from '@/lib/format/currency'
import { AddExpenseForm } from './add-expense-form'
import { CategoryRow } from './category-row'
import { ExpenseRow } from './expense-row'

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
              <CategoryRow key={category.category_id} category={category} />
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
            {expenses.rows.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} categories={categories} />
            ))}
          </ul>
        )}
      </section>

      <AddExpenseForm categories={categories} />
    </div>
  )
}
