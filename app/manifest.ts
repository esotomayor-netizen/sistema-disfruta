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
        src: '/api/app-icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/app-icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
