import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.aplicacion.deleteMany()
  await prisma.labor.deleteMany()
  await prisma.predio.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.empresa.deleteMany()

  const empresa = await prisma.empresa.create({
    data: {
      razonSocial: 'Agrícola Disfruta SpA',
      rut: '76.123.456-7',
      contactoNombre: 'Juan Pérez',
      contactoEmail: 'j.perez@disfruta.cl',
      contactoTelefono: '+56912345678',
    },
  })

  const [u1, u2, u3, u4] = await Promise.all([
    prisma.usuario.create({
      data: { nombre: 'Carlos', apellido: 'Mendoza', email: 'c.mendoza@disfruta.cl', rol: 'SUPERVISOR', telefono: '+56912345678', activo: true },
    }),
    prisma.usuario.create({
      data: { nombre: 'Ana', apellido: 'Ríos', email: 'a.rios@disfruta.cl', rol: 'TECNICO', telefono: '+56987654321', activo: true },
    }),
    prisma.usuario.create({
      data: { nombre: 'Pedro', apellido: 'Soto', email: 'p.soto@disfruta.cl', rol: 'APLICADOR', telefono: '+56911223344', activo: true },
    }),
    prisma.usuario.create({
      data: { nombre: 'Lucía', apellido: 'Vargas', email: 'l.vargas@disfruta.cl', rol: 'TECNICO', telefono: '+56955667788', activo: true },
    }),
  ])

  const [p1, p2, p3, p4] = await Promise.all([
    prisma.predio.create({
      data: { nombre: 'Fundo Norte', csg: 'CSG-001', superficie: 12.5, ubicacion: 'Sector Norte', activa: true, empresaId: empresa.id, encargadoId: u1.id, cultivos: { create: [{ cultivo: 'Cerezo' }] } },
    }),
    prisma.predio.create({
      data: { nombre: 'Fundo Sur', csg: 'CSG-002', superficie: 8.0, ubicacion: 'Sector Sur', activa: true, empresaId: empresa.id, encargadoId: u2.id, cultivos: { create: [{ cultivo: 'Manzano' }] } },
    }),
    prisma.predio.create({
      data: { nombre: 'Fundo Este', csg: 'CSG-003', superficie: 15.3, ubicacion: 'Sector Este', activa: true, empresaId: empresa.id, encargadoId: u3.id, cultivos: { create: [{ cultivo: 'Cerezo' }, { cultivo: 'Uva de mesa' }] } },
    }),
    prisma.predio.create({
      data: { nombre: 'Fundo Oeste', csg: 'CSG-004', superficie: 6.0, ubicacion: 'Sector Oeste', activa: false, empresaId: empresa.id, cultivos: { create: [{ cultivo: 'Pera' }] } },
    }),
  ])

  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const twoDaysAgo = new Date(now); twoDaysAgo.setDate(now.getDate() - 2)
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7)
  const inThreeDays = new Date(now); inThreeDays.setDate(now.getDate() + 3)

  await Promise.all([
    prisma.labor.create({
      data: { tipo: 'PODA', descripcion: 'Poda de formación temporada 2026', fecha: twoDaysAgo, estado: 'EN_PROGRESO', predioId: p1.id, responsableId: u2.id, observaciones: 'Avance 60% completado' },
    }),
    prisma.labor.create({
      data: { tipo: 'RIEGO', descripcion: 'Riego por goteo sector manzanos', fecha: yesterday, fechaFin: yesterday, estado: 'COMPLETADA', predioId: p2.id, responsableId: u3.id },
    }),
    prisma.labor.create({
      data: { tipo: 'CONTROL_PLAGAS', descripcion: 'Monitoreo de plagas y enfermedades', fecha: now, estado: 'PENDIENTE', predioId: p3.id, responsableId: u4.id },
    }),
    prisma.labor.create({
      data: { tipo: 'FERTILIZACION', descripcion: 'Fertilización foliar post-cuaje', fecha: inThreeDays, estado: 'PENDIENTE', predioId: p1.id, responsableId: u2.id },
    }),
  ])

  await Promise.all([
    prisma.aplicacion.create({
      data: { producto: 'Mancozeb 80 WP', tipoProducto: 'FUNGICIDA', dosis: 2.5, unidad: 'kg/ha', fecha: twoDaysAgo, estado: 'COMPLETADA', predioId: p1.id, tecnicoId: u3.id, observaciones: 'Aplicado con pulverizadora de 800L' },
    }),
    prisma.aplicacion.create({
      data: { producto: 'Chlorpyrifos 48 EC', tipoProducto: 'INSECTICIDA', dosis: 1.0, unidad: 'L/ha', fecha: yesterday, estado: 'COMPLETADA', predioId: p2.id, tecnicoId: u3.id },
    }),
    prisma.aplicacion.create({
      data: { producto: 'Nitrato de Potasio', tipoProducto: 'FERTILIZANTE', dosis: 5.0, unidad: 'kg/ha', fecha: inThreeDays, estado: 'PENDIENTE', predioId: p3.id, tecnicoId: u2.id },
    }),
  ])

  console.log('Base de datos inicializada con datos de ejemplo.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
