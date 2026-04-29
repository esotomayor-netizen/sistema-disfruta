import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { formatDate, TIPOS_PRODUCTO, LABOR_TIPOS, labelFromValue } from '@/lib/constants'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const visita = await prisma.visita.findUnique({
    where: { id: parseInt(params.id) },
    include: { predio: true },
  })
  return { title: visita ? `Informe Visita — ${visita.predio.nombre}` : 'Informe de Visita' }
}

const printStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 32px; }
  .page { max-width: 800px; margin: 0 auto; }
  .report-header { border-bottom: 2px solid #166534; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
  .report-header h1 { font-size: 18px; font-weight: 700; color: #166534; }
  .report-header .subtitle { font-size: 11px; color: #555; margin-top: 2px; }
  .report-header .meta { text-align: right; font-size: 10px; color: #555; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-orange { background: #ffedd5; color: #9a3412; }
  .badge-gray { background: #f3f4f6; color: #374151; }
  .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .info-item label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; display: block; margin-bottom: 2px; }
  .info-item span { font-size: 11px; font-weight: 600; color: #111; }
  .section { margin-bottom: 20px; }
  .section h2 { font-size: 13px; font-weight: 700; color: #166534; border-bottom: 1px solid #d1fae5; padding-bottom: 6px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f0fdf4; text-align: left; padding: 6px 8px; font-size: 10px; font-weight: 700; color: #166534; border: 1px solid #d1fae5; }
  td { padding: 6px 8px; font-size: 10px; border: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }
  .sketch-row td { background: #faf5ff; padding: 10px 12px; border-top: none; }
  .sketch-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #7c3aed; margin-bottom: 6px; }
  .sketch-wrap { border: 1px solid #e9d5ff; border-radius: 6px; overflow: hidden; background: white; display: inline-block; max-width: 100%; }
  .sketch-wrap svg { display: block; max-width: 100%; height: auto; }
  .report-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; }
  .firma { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .firma-box { border-top: 1px solid #374151; padding-top: 8px; font-size: 10px; color: #374151; text-align: center; }
  .no-print { margin-bottom: 20px; }
  @media print { .no-print { display: none !important; } }
`

export default async function ImprimirVisitaPage({ params }: { params: { id: string } }) {
  const visita = await prisma.visita.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      predio: { include: { empresa: true, encargado: true } },
      tecnico: true,
      labores: { include: { responsable: true }, orderBy: { createdAt: 'asc' } },
      aplicaciones: { include: { tecnico: true }, orderBy: { createdAt: 'asc' } },
    },
  })

  if (!visita) return notFound()

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#111', background: 'white', minHeight: '100vh', padding: 32 }}>
      <style>{printStyles}</style>
      <div className="page">

        {/* Botón imprimir — solo pantalla */}
        <div className="no-print">
          <PrintButton />
        </div>

        {/* Encabezado */}
        <div className="report-header">
          <div>
            <h1>Informe de Visita Técnica</h1>
            <p className="subtitle">Sistema Disfruta — Gestión Agrícola</p>
          </div>
          <div className="meta">
            <div style={{ marginBottom: 4 }}>
              <span className="badge badge-green">Visita Completada</span>
            </div>
            <p>Fecha visita: <strong>{formatDate(visita.fecha)}</strong></p>
            <p>Generado: {new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>

        {/* Info predio */}
        <div className="info-grid">
          <div className="info-item">
            <label>Predio</label>
            <span>{visita.predio.nombre}</span>
          </div>
          <div className="info-item">
            <label>Empresa</label>
            <span>{visita.predio.empresa.razonSocial}</span>
          </div>
          <div className="info-item">
            <label>CSG</label>
            <span style={{ fontFamily: 'monospace' }}>{visita.predio.csg}</span>
          </div>
          <div className="info-item">
            <label>Cultivo</label>
            <span>{visita.predio.cultivo}</span>
          </div>
          <div className="info-item">
            <label>Variedades</label>
            <span>{visita.predio.variedades ?? '—'}</span>
          </div>
          <div className="info-item">
            <label>Técnico</label>
            <span>{visita.tecnico.nombre} {visita.tecnico.apellido}</span>
          </div>
          <div className="info-item">
            <label>Encargado Predio</label>
            <span>{visita.predio.encargado ? `${visita.predio.encargado.nombre} ${visita.predio.encargado.apellido}` : '—'}</span>
          </div>
          <div className="info-item">
            <label>N° Actividades</label>
            <span>{visita.labores.length} labores · {visita.aplicaciones.length} aplicaciones</span>
          </div>
        </div>

        {/* Observaciones */}
        {visita.observaciones && (
          <div className="section">
            <h2>Observaciones Generales</h2>
            <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{visita.observaciones}</p>
          </div>
        )}

        {/* Labores */}
        <div className="section">
          <h2>Labores Realizadas ({visita.labores.length})</h2>
          {visita.labores.length === 0 ? (
            <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No se registraron labores en esta visita.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '30%' }}>Labor</th>
                  <th style={{ width: '18%' }}>Tipo</th>
                  <th style={{ width: '47%' }}>Descripción / Detalle</th>
                </tr>
              </thead>
              <tbody>
                {visita.labores.map((l, i) => (
                  <>
                    <tr key={l.id}>
                      <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                      <td><strong>{l.descripcion}</strong></td>
                      <td>
                        <span className={`badge ${l.tipo === 'PODA' ? 'badge-blue' : l.tipo === 'CONTROL_PLAGAS' ? 'badge-orange' : 'badge-gray'}`}>
                          {labelFromValue(LABOR_TIPOS, l.tipo)}
                        </span>
                      </td>
                      <td>{(l as any).observaciones ?? '—'}</td>
                    </tr>
                    {(l as any).dibujo && (
                      <tr key={`${l.id}-sketch`} className="sketch-row">
                        <td colSpan={4}>
                          <div className="sketch-label">Bosquejo técnico</div>
                          <div
                            className="sketch-wrap"
                            dangerouslySetInnerHTML={{ __html: (l as any).dibujo }}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Aplicaciones */}
        <div className="section">
          <h2>Aplicaciones Fitosanitarias ({visita.aplicaciones.length})</h2>
          {visita.aplicaciones.length === 0 ? (
            <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No se registraron aplicaciones en esta visita.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '28%' }}>Producto</th>
                  <th style={{ width: '15%' }}>Tipo</th>
                  <th style={{ width: '12%' }}>Dosis</th>
                  <th style={{ width: '40%' }}>Objetivo</th>
                </tr>
              </thead>
              <tbody>
                {visita.aplicaciones.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                    <td><strong>{a.producto}</strong></td>
                    <td>
                      <span className={`badge ${a.tipoProducto === 'FUNGICIDA' ? 'badge-blue' : a.tipoProducto === 'INSECTICIDA' ? 'badge-orange' : 'badge-gray'}`}>
                        {labelFromValue(TIPOS_PRODUCTO, a.tipoProducto)}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{a.dosis} {a.unidad}</td>
                    <td style={{ fontStyle: 'italic', color: '#374151' }}>{(a as any).observaciones ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Firmas */}
        <div className="firma">
          <div className="firma-box">
            <p><strong>{visita.tecnico.nombre} {visita.tecnico.apellido}</strong></p>
            <p style={{ color: '#6b7280' }}>Técnico Agrícola</p>
          </div>
          <div className="firma-box">
            <p><strong>{visita.predio.encargado ? `${visita.predio.encargado.nombre} ${visita.predio.encargado.apellido}` : '___________________'}</strong></p>
            <p style={{ color: '#6b7280' }}>Encargado del Predio</p>
          </div>
        </div>

        {/* Pie */}
        <div className="report-footer">
          <span>Sistema Disfruta · Fundo Disfruta</span>
          <span>Visita N° {visita.id} · {formatDate(visita.fecha)}</span>
        </div>
      </div>
    </div>
  )
}
