import { z } from 'zod'

const rupiah = z.coerce.number().int().min(0, 'Harga tidak boleh negatif').max(1_000_000_000)

export const seserahanItemSchema = z.object({
  name: z.string().trim().min(1, 'Nama barang belum diisi').max(200),
  category: z.string().trim().min(1, 'Kategori belum diisi').max(80),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  estimatedPrice: rupiah.optional(),
  // Tautan toko ditempel sendiri; tidak ada katalog terkurasi (aturan A6.3).
  productUrl: z.url('Tautan tidak valid').optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
})

export const togglePurchasedSchema = z.object({
  id: z.uuid(),
  purchased: z.enum(['true', 'false']).transform((v) => v === 'true'),
  actualPrice: rupiah.optional(),
})
