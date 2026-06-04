import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.aplicacion.deleteMany()
  await prisma.labor.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.predio.deleteMany()

  const [p1, p2, p3, p4] = await Promise.all([
    prisma.predio.create({ data: { nombre: 'Predio Norte', superficie: 12.5, cultivo: 'Vid', ubicacion: 'Sector Norte - Fundo Disfruta', activa: true } }),
    prisma.predio.create({ data: { nombre: 'Predio Sur', superficie: 8.0, cultivo: 'Manzano', ubicacion: 'Sector Sur - Fundo Disfruta', activa: true } }),
    prisma.predio.create({ data: { nombre: 'Predio Este', superficie: 15.3, cultivo: 'Pera', ubicacion: 'Sector Este - Fundo Disfruta', activa: true } }),
    prisma.predio.create({ data: { nombre: 'Predio Oeste', superficie: 6.0, cultivo: 'Cerezo', ubicacion: 'Sector Oeste - Fundo Disfruta', activa: false } }),
  ])

  const [u1, u2, u3, u4] = await Promise.all([
    prisma.usuario.create({ data: { nombre: 'Carlos', apellido: 'Mendoza', email: 'c.mendoza@disfruta.cl', rol: 'SUPERVISOR', telefono: '+56912345678', activo: true } }),
    prisma.usuario.create({ data: { nombre: 'Ana', apellido: 'Ríos', email: 'a.rios@disfruta.cl', rol: 'TECNICO', telefono: '+56987654321', activo: true } }),
    prisma.usuario.create({ data: { nombre: 'Pedro', apellido: 'Soto', email: 'p.soto@disfruta.cl', rol: 'APLICADOR', telefono: '+56911223344', activo: true } }),
    prisma.usuario.create({ data: { nombre: 'Lucía', apellido: 'Vargas', email: 'l.vargas@disfruta.cl', rol: 'TECNICO', telefono: '+56955667788', activo: true } }),
  ])

  const now = new Date()
  const twoDaysAgo = new Date(now); twoDaysAgo.setDate(now.getDate() - 2)
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const inThreeDays = new Date(now); inThreeDays.setDate(now.getDate() + 3)
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7)

  await Promise.all([
    prisma.labor.create({ data: { tipo: 'PODA', descripcion: 'Poda de formación temporada 2026', fecha: twoDaysAgo, estado: 'EN_PROGRESO', predioId: p1.id, responsableId: u2.id, observaciones: 'Avance 60% completado' } }),
    prisma.labor.create({ data: { tipo: 'RIEGO', descripcion: 'Riego por goteo sector manzanos', fecha: yesterday, fechaFin: yesterday, estado: 'COMPLETADA', predioId: p2.id, responsableId: u3.id } }),
    prisma.labor.create({ data: { tipo: 'CONTROL_PLAGAS', descripcion: 'Monitoreo de plagas y enfermedades', fecha: now, estado: 'PENDIENTE', predioId: p3.id, responsableId: u4.id } }),
    prisma.labor.create({ data: { tipo: 'FERTILIZACION', descripcion: 'Fertilización foliar post-cuaje', fecha: inThreeDays, estado: 'PENDIENTE', predioId: p1.id, responsableId: u2.id } }),
    prisma.labor.create({ data: { tipo: 'COSECHA', descripcion: 'Cosecha manual de manzanas Fuji', fecha: nextWeek, estado: 'PENDIENTE', predioId: p2.id, responsableId: u1.id } }),
  ])

  await Promise.all([
    prisma.aplicacion.create({ data: { producto: 'Mancozeb 80 WP', tipoProducto: 'FUNGICIDA', dosis: 2.5, unidad: 'kg/ha', fecha: twoDaysAgo, estado: 'COMPLETADA', predioId: p1.id, tecnicoId: u3.id, observaciones: 'Aplicado con pulverizadora de 800L' } }),
    prisma.aplicacion.create({ data: { producto: 'Chlorpyrifos 48 EC', tipoProducto: 'INSECTICIDA', dosis: 1.0, unidad: 'L/ha', fecha: yesterday, estado: 'COMPLETADA', predioId: p2.id, tecnicoId: u3.id } }),
    prisma.aplicacion.create({ data: { producto: 'Nitrato de Potasio', tipoProducto: 'FERTILIZANTE', dosis: 5.0, unidad: 'kg/ha', fecha: inThreeDays, estado: 'PENDIENTE', predioId: p3.id, tecnicoId: u2.id } }),
    prisma.aplicacion.create({ data: { producto: 'Glifosato 48%', tipoProducto: 'HERBICIDA', dosis: 3.0, unidad: 'L/ha', fecha: nextWeek, estado: 'PENDIENTE', predioId: p1.id, tecnicoId: u4.id } }),
  ])

  console.log('Base de datos inicializada con datos de ejemplo.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
