import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Disfruta - Exportadora de Fruta Fresca de Chile',
  description: 'Exportamos fruta de calidad superior producida bajo los más altos estándares, a través de un servicio de excelencia. 40 años de experiencia.',
}

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
