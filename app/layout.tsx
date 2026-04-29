import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalLayout from '@/components/ConditionalLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DLC Export - Gestión Agrícola',
  description: 'Plataforma de gestión agrícola de DLC Export — Disfruta · Lecaros · Cox · Chile',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}
