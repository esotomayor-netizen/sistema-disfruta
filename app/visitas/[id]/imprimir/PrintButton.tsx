'use client'

export default function PrintButton() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e5e7eb', marginBottom: 8 }}>
      <button
        onClick={() => window.print()}
        style={{ background: '#166534', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Imprimir / Guardar como PDF
      </button>
      <span style={{ fontSize: 11, color: '#9ca3af' }}>En el diálogo de impresión selecciona "Guardar como PDF" para descargar</span>
    </div>
  )
}
