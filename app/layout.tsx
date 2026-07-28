import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalLayout from '@/components/ConditionalLayout'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import AutoRefresh from '@/components/AutoRefresh'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DLC Export — Gestión Agrícola',
  description: 'Plataforma de gestión de visitas técnicas para Exportadora Disfruta',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Disfruta',
    startupImage: '/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3c5430',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <AutoRefresh />
          <ConditionalLayout>{children}</ConditionalLayout>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
