import { z } from 'zod'

/** Nominal selalu integer rupiah utuh, tidak pernah float (aturan A4.1, A4.2). */
const rupiah = z.coerce.number().int('Nominal harus bilangan bulat').min(0, 'Nominal tidak boleh negatif').max(100_000_000_000)

export const expenseSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul pengeluaran belum diisi').max(200),
    categoryId: z.uuid().optional().or(z.literal('')),
    amount: rupiah,
    paidAmount: rupiah.default(0),
    transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
    method: z.enum(['cash', 'transfer', 'ewallet', 'card', 'other']).optional().or(z.literal('')),
    note: z.string().trim().max(1000).optional().or(z.literal('')),
  })
  // Database menegakkan ini lewat CHECK (aturan A4.4); di sini kita menolak
  // lebih awal supaya pesannya bisa berbahasa manusia.
  .refine((value) => value.paidAmount <= value.amount, {
    message: 'Nominal terbayar tidak boleh melebihi total biaya.',
    path: ['paidAmount'],
  })

export const budgetCategorySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori belum diisi').max(80),
  plannedAmount: rupiah.default(0),
})
