import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Recepcion } from './cosecha-store'
import type { ProgramacionRow } from './cosecha-data'
import { SEMANAS } from './cosecha-data'

export function generarPDFProductor(
  productor: string,
  programacion: ProgramacionRow[],
  recepciones: Recepcion[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = margin

  // ── Header ────────────────────────────────────────────────
  doc.setFillColor(22, 101, 52)  // dark green (primary-900 approximation)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('DISFRUTA × LECAROS COX', margin, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Informe de Avance de Cosecha — Temporada 2026-2027', margin, 19)
  doc.text(`Emitido: ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW - margin, 19, { align: 'right' })

  // ── Producer name ──────────────────────────────────────────
  y = 36
  doc.setTextColor(22, 101, 52)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`Productor: ${productor}`, margin, y)
  y += 8

  // ── Get varieties for this producer ────────────────────────
  const rowsProductor = programacion.filter(r =>
    r.productor.toUpperCase() === productor.toUpperCase()
  )
  const variedades = Array.from(new Set(rowsProductor.map(r => r.variedad)))

  // ── Summary table ──────────────────────────────────────────
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN GENERAL POR VARIEDAD', margin, y)
  y += 4

  const summaryRows: (string | number)[][] = []
  let totalPlan = 0, totalReal = 0

  for (const variedad of variedades) {
    const kgPlan = rowsProductor
      .filter(r => r.variedad === variedad)
      .reduce((s, r) => s + r.totalKg, 0)
    const kgReal = recepciones
      .filter(r => r.productor.toUpperCase() === productor.toUpperCase() && r.variedad.toUpperCase() === variedad.toUpperCase())
      .reduce((s, r) => s + r.kgRecepcionado, 0)
    const pct = kgPlan > 0 ? Math.round(kgReal / kgPlan * 100) : 0
    totalPlan += kgPlan
    totalReal += kgReal
    summaryRows.push([
      variedad,
      kgPlan.toLocaleString('es-CL'),
      kgReal.toLocaleString('es-CL'),
      kgPlan - kgReal > 0 ? `-${(kgPlan - kgReal).toLocaleString('es-CL')}` : '✓',
      `${pct}%`,
      pct >= 100 ? 'Completado' : pct >= 50 ? 'En curso' : kgReal === 0 ? 'Sin inicio' : 'Atrasado'
    ])
  }

  // Total row
  const pctTotal = totalPlan > 0 ? Math.round(totalReal / totalPlan * 100) : 0
  summaryRows.push([
    'TOTAL',
    totalPlan.toLocaleString('es-CL'),
    totalReal.toLocaleString('es-CL'),
    totalPlan - totalReal > 0 ? `-${(totalPlan - totalReal).toLocaleString('es-CL')}` : '✓',
    `${pctTotal}%`,
    ''
  ])

  autoTable(doc, {
    startY: y,
    head: [['Variedad', 'KG Plan', 'KG Real', 'Diferencia', '% Cumpl.', 'Estado']],
    body: summaryRows,
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
      // Highlight total row
      if (data.row.index === summaryRows.length - 1) {
        doc.setFillColor(220, 252, 231)
      }
    },
    margin: { left: margin, right: margin },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ── Weekly detail per variety ──────────────────────────────
  for (const variedad of variedades) {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage()
      y = margin
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 101, 52)
    doc.text(`DETALLE SEMANAL — ${variedad}`, margin, y)
    y += 4
    doc.setTextColor(0, 0, 0)

    const weeklyRows: (string | number)[][] = []
    let acumPlan = 0, acumReal = 0

    for (const sem of SEMANAS) {
      const kgPlan = rowsProductor
        .filter(r => r.variedad === variedad)
        .reduce((s, r) => s + ((r[sem.key] as number) || 0), 0)
      const kgReal = recepciones
        .filter(r =>
          r.productor.toUpperCase() === productor.toUpperCase() &&
          r.variedad.toUpperCase() === variedad.toUpperCase() &&
          r.semana === sem.key
        )
        .reduce((s, r) => s + r.kgRecepcionado, 0)

      if (kgPlan === 0 && kgReal === 0) continue  // skip empty weeks

      acumPlan += kgPlan
      acumReal += kgReal
      const diff = kgReal - kgPlan
      const pct = kgPlan > 0 ? Math.round(kgReal / kgPlan * 100) : (kgReal > 0 ? 100 : 0)

      weeklyRows.push([
        `${sem.label} (${sem.fecha})`,
        kgPlan > 0 ? kgPlan.toLocaleString('es-CL') : '—',
        kgReal > 0 ? kgReal.toLocaleString('es-CL') : '—',
        kgPlan > 0 ? (diff >= 0 ? `+${diff.toLocaleString('es-CL')}` : diff.toLocaleString('es-CL')) : '—',
        kgPlan > 0 ? `${pct}%` : '—',
        acumPlan.toLocaleString('es-CL'),
        acumReal.toLocaleString('es-CL'),
      ])
    }

    if (weeklyRows.length === 0) {
      weeklyRows.push(['Sin datos planificados', '', '', '', '', '', ''])
    }

    autoTable(doc, {
      startY: y,
      head: [['Semana', 'KG Plan', 'KG Real', 'Diferencia', '% Sem.', 'Acum. Plan', 'Acum. Real']],
      body: weeklyRows,
      theme: 'grid',
      headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'right' },
        6: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  // ── Footer ─────────────────────────────────────────────────
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(
      `DISFRUTA × LECAROS COX — Temporada 2026-2027 — Página ${i} de ${totalPages}`,
      pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' }
    )
  }

  // Download
  const filename = `Avance_Cosecha_${productor.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
