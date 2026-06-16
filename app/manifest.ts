import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DLC Export — Gestión Agrícola',
    short_name: 'DLC Export',
    description: 'Plataforma de gestión de visitas técnicas para Exportadora Disfruta',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#3c5430',
    theme_color: '#3c5430',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
