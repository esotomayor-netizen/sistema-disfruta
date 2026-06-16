import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalLayout from '@/components/ConditionalLayout'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DLC Export - Gestión Agrícola',
  description: 'Plataforma de gestión agrícola de DLC Export — Disfruta · Lecaros · Cox · Chile',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <ConditionalLayout>{children}</ConditionalLayout>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
