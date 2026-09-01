import type { PaymentMethod } from '@/types/database'

/**
 * Logika murni modul anggaran. Seluruh nominal adalah integer rupiah utuh —
 * tidak pernah float (aturan A4.1).
 */

export type StatusBayar = 'belum' | 'dp' | 'lunas'

export const LABEL_STATUS: Record<StatusBayar, string> = {
  belum: 'Belum bayar',
  dp: 'DP',
  lunas: 'Lunas',
}

export const KELAS_STATUS: Record<StatusBayar, string> = {
  belum: 'bg-cream-200 text-ink-700',
  dp: 'bg-brand-50 text-brand-700',
  lunas: 'bg-sage-50 text-sage-700',
}

export const LABEL_METODE: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  ewallet: 'E-wallet',
  card: 'Kartu',
  other: 'Lainnya',
}

/**
 * Status pembayaran DITURUNKAN dari nominal, tidak pernah disimpan sebagai
 * kolom sendiri (aturan A4.5). Dengan begitu status tidak mungkin bertentangan
 * dengan angkanya.
 */
export function statusBayar(amount: number, paidAmount: number): StatusBayar {
  if (paidAmount <= 0) return 'belum'
  if (paidAmount >= amount) return 'lunas'
  return 'dp'
}

/** Sisa yang masih harus dibayar untuk satu pengeluaran. */
export function sisaBayar(amount: number, paidAmount: number): number {
  return Math.max(amount - paidAmount, 0)
}

/**
 * Persentase pemakaian terhadap alokasi. Alokasi nol menghasilkan 0,
 * bukan pembagian dengan nol.
 */
export function persenPakai(spent: number, planned: number): number {
  if (planned <= 0) return 0
  return Math.round((spent / planned) * 100)
}

/** Melebihi alokasi hanya berarti bila alokasinya memang diisi (aturan A4.7). */
export function melebihiAlokasi(spent: number, planned: number): boolean {
  return planned > 0 && spent > planned
}

/**
 * Bagian dari total budget yang belum dialokasikan ke kategori mana pun.
 * Boleh negatif bila alokasi kategori melebihi total budget (aturan A4.9).
 */
export function belumDialokasikan(totalBudget: number, totalPlanned: number): number {
  return totalBudget - totalPlanned
}
