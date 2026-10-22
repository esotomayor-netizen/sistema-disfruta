export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Propuesta {
  id: string
  tipo: 'labor' | 'aplicacion' | 'observacion'
  estado: 'pendiente' | 'guardada' | 'descartada'
  datos: Record<string, string>
  referenciaId?: number
}

export async function PATCH(req: Request, { params }: { params: { mensajeId: string } }) {
  const { propuestaId, estado, referenciaId } = (await req.json()) as {
    propuestaId: string
    estado: 'guardada' | 'descartada'
    referenciaId?: number
  }

  const mensaje = await prisma.visitaMensaje.findUnique({ where: { id: parseInt(params.mensajeId) } })
  if (!mensaje) return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })

  const propuestas = (mensaje.propuestas as unknown as Propuesta[]) || []
  const actualizadas = propuestas.map((p) =>
    p.id === propuestaId ? { ...p, estado, ...(referenciaId ? { referenciaId } : {}) } : p
  )

  const actualizado = await prisma.visitaMensaje.update({
    where: { id: mensaje.id },
    data: { propuestas: actualizadas as any },
  })

  return NextResponse.json(actualizado)
}
