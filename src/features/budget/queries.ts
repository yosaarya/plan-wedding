import 'server-only'
import { requireWedding } from '@/lib/auth/guards'
import { PAGE_SIZE } from '@/lib/constants'
import type { BudgetCategory, Expense } from '@/types/database'

export type CategorySummary = {
  wedding_id: string
  category_id: string
  name: string
  icon: string | null
  color: string | null
  sort_order: number
  planned_amount: number
  spent_amount: number
  paid_amount: number
  usage_percent: number
  is_over: boolean
}

/** Ringkasan per kategori diagregasi di SQL, tidak dijumlahkan di JS (aturan A4.10). */
export async function listCategorySummary(): Promise<CategorySummary[]> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('budget_category_summary')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal membaca ringkasan anggaran: ${error.message}`)
  return (data ?? []) as CategorySummary[]
}

export async function listBudgetCategories(): Promise<BudgetCategory[]> {
  const { supabase, weddingId } = await requireWedding()

  const { data, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal membaca kategori anggaran: ${error.message}`)
  return (data ?? []) as BudgetCategory[]
}

/** Daftar pengeluaran dipaginasi seperti daftar tamu (aturan B6.1). */
export async function listExpenses(options: { categoryId?: string; page?: number } = {}) {
  const { supabase, weddingId } = await requireWedding()
  const page = Math.max(options.page ?? 1, 1)
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('expenses')
    .select('*', { count: 'exact' })
    .eq('wedding_id', weddingId)

  if (options.categoryId) query = query.eq('category_id', options.categoryId)

  const { data, error, count } = await query
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (error) throw new Error(`Gagal membaca pengeluaran: ${error.message}`)

  const total = count ?? 0
  return {
    rows: (data ?? []) as Expense[],
    total,
    page,
    pageCount: Math.max(Math.ceil(total / PAGE_SIZE), 1),
  }
}
