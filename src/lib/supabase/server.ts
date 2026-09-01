import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Klien Supabase untuk Server Component dan Server Action.
 *
 * Membawa JWT pengguna, sehingga RLS selalu aktif. Aplikasi ini tidak pernah
 * memakai service role (aturan B2.2).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Component tidak boleh menulis cookie. Penyegaran sesi
            // ditangani middleware, jadi ini aman diabaikan.
          }
        },
      },
    },
  )
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Environment variable ${name} belum diisi. Salin .env.example menjadi .env.local.`,
    )
  }
  return value
}
