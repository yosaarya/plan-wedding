'use server'

import { revalidatePath } from 'next/cache'
import { requireWedding } from '@/lib/auth/guards'
import { budgetCategorySchema, expenseSchema, totalBudgetSchema } from './schema'

type Result = { error?: string }

export async function createExpense(formData: FormData): Promise<Result> {
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase.from('expenses').insert({
    wedding_id: weddingId,
    category_id: input.categoryId || null,
    title: input.title,
    amount: input.amount,
    paid_amount: input.paidAmount,
    transaction_date: input.transactionDate,
    method: input.method || null,
    note: input.note || null,
  })

  if (error) return { error: `Gagal menyimpan pengeluaran: ${error.message}` }

  revalidateBudgetViews()
  return {}
}

export async function updateExpense(id: string, formData: FormData): Promise<Result> {
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }
  const input = parsed.data

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('expenses')
    .update({
      category_id: input.categoryId || null,
      title: input.title,
      amount: input.amount,
      paid_amount: input.paidAmount,
      transaction_date: input.transactionDate,
      method: input.method || null,
      note: input.note || null,
    })
    .eq('id', id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menyimpan perubahan: ${error.message}` }

  revalidateBudgetViews()
  return {}
}

export async function deleteExpense(id: string): Promise<Result> {
  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menghapus pengeluaran: ${error.message}` }

  revalidateBudgetViews()
  return {}
}

export async function setTotalBudget(formData: FormData): Promise<Result> {
  const parsed = totalBudgetSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Nominal belum benar.' }

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('weddings')
    .update({ total_budget: parsed.data.totalBudget })
    .eq('id', weddingId)

  if (error) return { error: `Gagal menyimpan total budget: ${error.message}` }

  revalidateBudgetViews()
  return {}
}

export async function updateCategoryPlan(id: string, formData: FormData): Promise<Result> {
  const parsed = budgetCategorySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Isian belum benar.' }

  const { supabase, weddingId } = await requireWedding()

  const { error } = await supabase
    .from('budget_categories')
    .update({ name: parsed.data.name, planned_amount: parsed.data.plannedAmount })
    .eq('id', id)
    .eq('wedding_id', weddingId)

  if (error) return { error: `Gagal menyimpan kategori: ${error.message}` }

  revalidateBudgetViews()
  return {}
}

function revalidateBudgetViews() {
  revalidatePath('/anggaran')
  revalidatePath('/beranda')
}
