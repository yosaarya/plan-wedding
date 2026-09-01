import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Persiapan Nikah',
  description: 'Countdown, checklist, anggaran, dan daftar tamu dalam satu tempat.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Persiapan Nikah' },
}

export const viewport: Viewport = {
  themeColor: '#FDF8F3',
  width: 'device-width',
  initialScale: 1,
  // Jangan kunci zoom: pengguna harus tetap bisa memperbesar teks.
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
