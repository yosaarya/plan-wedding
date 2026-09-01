import { z } from 'zod'

export const checklistItemSchema = z.object({
  title: z.string().trim().min(1, 'Judul tugas belum diisi').max(200),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  categoryId: z.uuid().optional().or(z.literal('')),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  assignedTo: z.enum(['groom', 'bride', 'both']).default('both'),
})

export const toggleSchema = z.object({
  id: z.uuid(),
  done: z.enum(['true', 'false']).transform((v) => v === 'true'),
})

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori belum diisi').max(80),
})
