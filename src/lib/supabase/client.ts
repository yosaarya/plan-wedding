'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Klien Supabase untuk browser.
 *
 * Dipakai HANYA untuk auth (login, reset password) dan halaman RSVP publik.
 * Data domain tidak pernah diambil langsung dari klien — baca lewat Server
 * Component, tulis lewat Server Action (aturan B2.1).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
