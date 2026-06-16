import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const size = Math.min(512, Math.max(48, parseInt(req.nextUrl.searchParams.get('size') ?? '192')))
  const leaf = Math.round(size * 0.52)
  const label = Math.round(size * 0.13)

  return new ImageResponse(
    <div
      style={{
        background: '#3c5430',
        width: size,
        height: size,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
      }}
    >
      <div style={{ fontSize: leaf, lineHeight: 1 }}>🌿</div>
      <div
        style={{
          fontSize: label,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.80)',
          letterSpacing: '-0.5px',
        }}
      >
        DLC Export
      </div>
    </div>,
    { width: size, height: size }
  )
}
