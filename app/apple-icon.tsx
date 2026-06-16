import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: '#3c5430',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
      }}
    >
      <div style={{ fontSize: 90, lineHeight: 1 }}>🌿</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '-0.5px',
        }}
      >
        DLC
      </div>
    </div>,
    { ...size }
  )
}
