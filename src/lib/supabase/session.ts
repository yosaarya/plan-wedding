import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Menyegarkan sesi Supabase pada setiap permintaan dan memblokir area
 * terproteksi bagi yang belum login (arsitektur §6.3).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // getUser() memverifikasi token ke server auth. getSession() hanya membaca
  // cookie dan tidak boleh dipercaya untuk keputusan otorisasi.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic =
    path.startsWith('/masuk') ||
    path.startsWith('/lupa-password') ||
    path.startsWith('/rsvp') ||
    path.startsWith('/auth')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/masuk'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (user && path.startsWith('/masuk')) {
    const url = request.nextUrl.clone()
    url.pathname = '/beranda'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
