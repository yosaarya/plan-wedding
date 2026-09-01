import { z } from 'zod'

/** Skema dipakai bersama oleh form di klien dan Server Action di server (aturan B1.2). */

export const onboardingSchema = z.object({
  groomName: z.string().trim().min(1, 'Nama calon pengantin pria belum diisi').max(80),
  brideName: z.string().trim().min(1, 'Nama calon pengantin wanita belum diisi').max(80),
  city: z.string().trim().max(80).optional().or(z.literal('')),

  // Tanggal akad wajib (aturan A2.1). Boleh di masa lalu (aturan A2.4).
  akadDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal akad belum diisi'),
  akadTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Jam tidak valid')
    .optional()
    .or(z.literal('')),

  // Resepsi opsional; bila kosong dianggap sama dengan akad (aturan A2.1).
  resepsiDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),

  venueName: z.string().trim().max(120).optional().or(z.literal('')),

  estimatedGuests: z.coerce.number().int().min(0).max(10_000).optional(),

  // Integer rupiah utuh, tidak pernah float (aturan A4.1).
  totalBudget: z.coerce.number().int().min(0).max(100_000_000_000).optional(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
