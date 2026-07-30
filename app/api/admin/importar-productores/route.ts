export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

// ── Planilla de productores (INFO_PRODUCTORES_LECAROSDISFRUTA_CLAUDE.xlsx) ───
// Fila por productor: razón social tal como viene en la planilla, CSG(s) del
// SAG (puede haber más de uno separados por "-"), encargado, mail y teléfono.
// Filas exactamente duplicadas en la planilla original ya fueron unificadas.
const FILAS: { razon: string; csg: string | null; encargado: string | null; mail: string | null; telefono: string | null }[] = [
  { razon: 'AGRÍCOLA EL RULO SOCIEDAD LIMITADA', csg: '172586', encargado: 'JOSÉ FRANCISCO SANCHEZ', mail: 'JOSEFRANCISCO.SANCHEZFIGUEROA@GMAIL.COM', telefono: '56990795387' },
  { razon: 'AGRÍCOLA LIRA GARCES LTDA', csg: '107686', encargado: 'ALEJANDRO LIRA', mail: 'alejolira@gmail.com', telefono: '56994588555' },
  { razon: 'SERGIO ROBERTO COFRE ALVAREZ', csg: '3115461-3126580-153412-3143266', encargado: 'SERGIO COFRE', mail: 'E.SOTOMAYOR@EXPORTADORADISFRUTA.CL', telefono: '56998373494' },
  { razon: 'VITIVINICOLA CREMASCHI', csg: '169553', encargado: 'ANDRES CREMASCHI', mail: 'SCREMASCHI@CF.CL', telefono: '56997515159' },
  { razon: 'AGRÍCOLA FUSIÓN SPA', csg: '174461', encargado: 'MARIANO SALAS', mail: 'MSALAS@FUSION.CL', telefono: '56990477121' },
  { razon: 'AGRÍCOLA E INVERSIONES ROCO SPA', csg: '160831', encargado: 'ROBERTO GERMAIN', mail: 'robergermain@gmail.com', telefono: '56994494732' },
  { razon: 'AGRÍCOLA J LECAROS LTDA', csg: '118224', encargado: 'JORGE LECAROS', mail: 'j.lecaros@lcfruit.com', telefono: '56978775641' },
  { razon: 'JOSÉ ANTONIO DE LA JARA SILVA', csg: '171784', encargado: 'JOSÉ DE LA JARA', mail: 'josedelajaras@gmail.com', telefono: '56992786599' },
  { razon: 'LUIS ALBERTO DE LA JARA SILVA', csg: '177929', encargado: 'LUIS DE LA JARA', mail: 'lavinculo@gmail.com', telefono: '56974979842' },
  { razon: 'MARÍA RITA GONZALEZ URZUA', csg: '3126282', encargado: 'GUILLERMO MACKENZIE', mail: 'gmo_mackenzie@hotmail.com', telefono: '56987191558' },
  { razon: 'SOCIEDAD COMERCIAL AGRICOLA INMOBILIARIA LA FUENTE LTDA', csg: null, encargado: 'MAURICIO SERRANO', mail: 'E.SOTOMAYOR@EXPORTADORADISFRUTA.CL', telefono: '56975790089' },
  { razon: 'AGRÍCOLA RICARDO BRINKMANN PARADA SPA', csg: '3103510', encargado: 'FRANCISCO BRINKMANN', mail: 'FCOBRINKMANN@GMAIL.COM', telefono: '56981957320' },
  { razon: 'AGRÍCOLA SAN ALBERTO LIMITADA', csg: '90732', encargado: 'SEBASTIAN LIRA', mail: 'SEB.LIRA@YAHOO.ES', telefono: '56978567321' },
  { razon: 'AGRICOLA SANTA MARIA DE ODESSA LIMITADA', csg: '95779', encargado: 'ANDRES LECAROS', mail: 'ANDRESLECAROS@LPCIA.CL', telefono: '56991623248' },
  { razon: 'AGRÍCOLA SANTA ROSARIO LIMITADA', csg: '95400', encargado: 'JORGE LECAROS', mail: 'j.lecaros@lcfruit.com', telefono: '56978775641' },
  { razon: 'COCO', csg: null, encargado: null, mail: 'E.SOTOMAYOR@EXPORTADORADISFRUTA.CL', telefono: null },
  { razon: 'INVERSIONES ALTO RENGO LIMITADA', csg: '153813', encargado: 'PATRICIO FARIAS', mail: 'VIVEROS@CORCOLEN.CL', telefono: null },
  { razon: 'INVERSIONES MAULE S.A', csg: '97574', encargado: 'TOMÁS GAEDECHENS', mail: 'TGM@LOSGANADEROS.CL', telefono: '56982890249' },
  { razon: 'SOCIEDAD AGRÍCOLA SAN NICOLAS DE LA PALMA LIMITADA', csg: '91619', encargado: 'MANUEL ALVAREZ', mail: 'E.SOTOMAYOR@EXPORTADORADISFRUTA.CL', telefono: '56998254369' },
  { razon: 'SOCIEDAD AGRÍCOLA TOTIHUE LIMITADA', csg: '3153979', encargado: 'JUAN PABLO BARTOLOME', mail: 'JPBARTOLOMEORUETA@GMAIL.COM', telefono: '56987428572' },
  { razon: 'AGRO LIQUID S.A', csg: '3141487', encargado: 'JUAN EDUARDO COX', mail: 'JECOXVIAL@GMAIL.COM', telefono: '56998227630' },
  { razon: 'VARAS', csg: null, encargado: 'ALFREDO LABBE', mail: 'E.SOTOMAYOR@EXPORTADORADISFRUTA.CL', telefono: '56992393319' },
  { razon: 'CORNEJO MUÑOZ ALIRO ANDRES', csg: '119368', encargado: 'ALIRO CORNEJO', mail: 'ACORNEJOM1961@HOTMAIL.COM', telefono: '56995483784' },
  { razon: 'ANDREA DEL PILAR FARIAS LORCA', csg: '3129656', encargado: 'PILAR FARIAS', mail: 'PILARFARIAS033@GMAIL.COM', telefono: '56958332911' },
  { razon: 'ANDRES RISOPATRÓN IÑIGUEZ', csg: '161057', encargado: 'RAIMUNDO RISOPATRÓN', mail: 'RRISOPATRON@GMAIL.COM', telefono: '56995760744' },
  { razon: 'MARTINEZ FELIPE ANGEL FELIPE', csg: '116120', encargado: 'ANGEL MARTINEZ', mail: 'ANGELFELIPEMT3@HOTMAIL.COM', telefono: '56984352538' },
  { razon: 'AGRÍCOLA CASAS VIEJAS LIMITADA', csg: '99315', encargado: 'FAISAL HARCHA', mail: 'AGRICOLACASASVIEJAS@GMAIL.COM', telefono: '56994024637' },
  { razon: 'AGRÍCOLA COPA DE AGUA LIMITADA', csg: '3176698', encargado: 'JAIME SOTO', mail: 'JAIME.AGUSTIN@ICLOUD.CL', telefono: '56998733868' },
  { razon: 'SOCIEDAD AGRÍCOLA DELIFRUT LIMITADA', csg: '152906', encargado: 'DAGOBERTO CORNEJO', mail: 'INFO@DELIPLANT.CL', telefono: '5699452360' },
  { razon: 'VARAS', csg: null, encargado: 'ALENA SANCHEZ', mail: 'E.SOTOMAYOR@EXPORTADORADISFRUTA.CL', telefono: null },
  { razon: 'VARAS', csg: null, encargado: 'FERNANDO BELLOLIO', mail: 'FBL@AGRICOLASANISIDRO.CL', telefono: '56992328942' },
  { razon: 'AGRÍCOLA SANTA CLAUDIA SPA', csg: '110319', encargado: 'GUILLERMO PRIETO', mail: 'PRIETOGUILLERMO780@GMAIL.COM', telefono: '56975557432' },
  { razon: 'VARAS', csg: null, encargado: 'JUAN EDUARDO COX', mail: 'JECOXVIAL@GMAIL.COM', telefono: '56998227630' },
  { razon: 'VARAS', csg: null, encargado: 'JUAN PABLO MUÑOZ', mail: 'JUANPABLO@MUNOZCORRETAJES.CL', telefono: '56998218548' },
  { razon: 'COMERCIAL LAS NECINAS LIMITADA', csg: '95423', encargado: 'GLORIA ARMIJO', mail: 'CLASENCINAS@GMAIL.COM', telefono: '56990175627' },
  { razon: 'AGRÍCOLA LAS RAICES SPA', csg: '96274', encargado: 'MARIO SOTELO', mail: 'LASRACICES.SPA@GMAIL.COM', telefono: '56989600852' },
  { razon: 'VARAS', csg: null, encargado: 'MARIA JOSÉ PRIETO', mail: 'E.SOTOMAYOR@EXPORTADORADISFRUTA.CL', telefono: null },
  { razon: 'VARAS', csg: null, encargado: 'RAÚL VEAS', mail: 'E.SOTOMAYOR@EXPORTADORADISFRUTA.CL', telefono: '56981391704' },
  { razon: 'INVERSIONES SAN DANIELE LTDA', csg: '112196', encargado: 'CRISTOBAL BUTAZZONI', mail: 'CRISTOBAL@SANDANIELE.CL', telefono: '56995096268' },
  { razon: 'TORREFRUT LIMITADA', csg: '3176834', encargado: 'JUAN TORRES BARROS', mail: 'TORREFRUT@GMAIL.COM', telefono: '56992432478' },
]

function normalizar(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function slug(s: string): string {
  return normalizar(s).toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo un supervisor puede ejecutar esta importación' }, { status: 403 })
  }

  const { dryRun = true } = await req.json().catch(() => ({}))

  const [empresas, predios, usuariosExistentes] = await Promise.all([
    prisma.empresa.findMany({ select: { id: true, razonSocial: true } }),
    prisma.predio.findMany({ select: { id: true, nombre: true, csg: true, empresaId: true, encargadoId: true } }),
    prisma.usuario.findMany({ select: { id: true, email: true, nombre: true, apellido: true } }),
  ])

  const emailsExistentes = new Set(usuariosExistentes.map((u) => u.email.toLowerCase()))

  // Emails que en la planilla aparecen repetidos para MÁS DE UN encargado distinto
  // (típicamente el correo de Eduardo usado como relleno) — a esos no se les puede
  // asignar ese email real porque el campo es único, se les genera uno de reemplazo.
  const emailAEncargados = new Map<string, Set<string>>()
  for (const f of FILAS) {
    if (!f.mail || !f.encargado) continue
    const key = f.mail.trim().toLowerCase()
    if (!emailAEncargados.has(key)) emailAEncargados.set(key, new Set())
    emailAEncargados.get(key)!.add(normalizar(f.encargado))
  }
  const emailsCompartidos = new Set(
    Array.from(emailAEncargados.entries()).filter(([, nombres]) => nombres.size > 1).map(([email]) => email)
  )

  const emailsUsadosEnEsteImport = new Set<string>()

  function emailFinalPara(encargado: string, mailOriginal: string | null): { email: string; sintetico: boolean } {
    const original = (mailOriginal ?? '').trim().toLowerCase()
    const necesitaSintetico =
      !original ||
      emailsCompartidos.has(original) ||
      (emailsExistentes.has(original) && !emailsUsadosEnEsteImport.has(original))

    if (!necesitaSintetico) return { email: original, sintetico: false }

    const base = slug(encargado) || 'productor'
    let candidato = `${base}@productor.disfruta.cl`
    let i = 2
    while (emailsExistentes.has(candidato) || emailsUsadosEnEsteImport.has(candidato)) {
      candidato = `${base}${i}@productor.disfruta.cl`
      i++
    }
    return { email: candidato, sintetico: true }
  }

  const reporte: any[] = []

  for (const fila of FILAS) {
    const razonNorm = normalizar(fila.razon)
    let empresa = empresas.find((e) => normalizar(e.razonSocial) === razonNorm) ?? null

    let prediosMatch: typeof predios = []
    let estrategia = ''
    let csgSinMatch: string[] = []

    if (empresa) {
      const csgList = fila.csg ? fila.csg.split('-').map((c) => c.trim()).filter(Boolean) : []
      if (csgList.length > 0) {
        prediosMatch = predios.filter((p) => p.empresaId === empresa!.id && csgList.includes((p.csg ?? '').trim()))
        csgSinMatch = csgList.filter((c) => !prediosMatch.some((p) => (p.csg ?? '').trim() === c))
        estrategia = 'empresa + CSG'
      } else {
        prediosMatch = predios.filter((p) => p.empresaId === empresa!.id)
        estrategia = 'empresa (sin CSG en planilla, se asigna a todos sus predios)'
      }
    } else {
      let p = predios.find((p) => normalizar(p.nombre) === razonNorm)
      if (!p && fila.encargado) p = predios.find((p) => normalizar(p.nombre) === normalizar(fila.encargado))
      if (p) {
        prediosMatch = [p]
        estrategia = 'predio encontrado por nombre (no hubo match de razón social)'
      }
    }

    if (!fila.encargado) {
      reporte.push({ ...fila, accion: 'OMITIDO', motivo: 'Fila sin nombre de encargado', prediosAfectados: [] })
      continue
    }
    if (prediosMatch.length === 0) {
      reporte.push({ ...fila, accion: 'OMITIDO', motivo: 'No se encontró razón social ni predio correspondiente en el sistema', prediosAfectados: [] })
      continue
    }

    const { email: emailFinal, sintetico } = emailFinalPara(fila.encargado, fila.mail)
    emailsUsadosEnEsteImport.add(emailFinal)

    const partes = fila.encargado.trim().split(/\s+/)
    const nombre = partes[0]
    const apellido = partes.slice(1).join(' ') || partes[0]

    reporte.push({
      razon: fila.razon,
      encargado: fila.encargado,
      nombre,
      apellido,
      emailPlanilla: fila.mail,
      emailFinal,
      emailSintetico: sintetico,
      telefono: fila.telefono,
      estrategiaMatch: estrategia,
      empresaEncontrada: empresa?.razonSocial ?? null,
      csgSinMatch,
      accion: dryRun ? 'PREVIEW' : 'IMPORTADO',
      prediosAfectados: prediosMatch.map((p) => ({ id: p.id, nombre: p.nombre, csg: p.csg, teniaEncargado: p.encargadoId != null })),
    })

    if (!dryRun) {
      const usuario = await prisma.usuario.upsert({
        where: { email: emailFinal },
        update: {
          nombre,
          apellido,
          telefono: fila.telefono || undefined,
          rol: 'ENCARGADO',
          activo: true,
        },
        create: {
          nombre,
          apellido,
          email: emailFinal,
          rol: 'ENCARGADO',
          telefono: fila.telefono || null,
          activo: true,
        },
      })

      await prisma.predio.updateMany({
        where: { id: { in: prediosMatch.map((p) => p.id) } },
        data: { encargadoId: usuario.id },
      })
    }
  }

  const resumen = {
    total: FILAS.length,
    procesados: reporte.filter((r) => r.accion !== 'OMITIDO').length,
    omitidos: reporte.filter((r) => r.accion === 'OMITIDO').length,
    prediosAfectados: reporte.reduce((s, r) => s + (r.prediosAfectados?.length ?? 0), 0),
  }

  return NextResponse.json({ dryRun, resumen, reporte })
}
