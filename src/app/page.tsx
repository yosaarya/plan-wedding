import { redirect } from 'next/navigation'

/** Akar aplikasi langsung ke beranda; middleware yang menentukan perlu login atau tidak. */
export default function RootPage() {
  redirect('/beranda')
}
