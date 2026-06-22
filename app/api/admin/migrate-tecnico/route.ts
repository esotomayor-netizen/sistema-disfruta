export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

/**
 * Aplica manualmente el cambio de esquema tecnicoId (Empresa/Predio) en producción.
 * Usa la conexión de Prisma en runtime, evitando depender de DATABASE_URL fuera del servidor
 * (p.ej. cuando la variable está marcada como "Sensitive" en Vercel y no se puede copiar).
 * Idempotente: se puede llamar varias veces sin efectos secundarios.
 */
export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo supervisores pueden ejecutar esta acción' }, { status: 403 })
  }

  const steps: string[] = []

  async function run(label: string, sql: string) {
    try {
      await prisma.$executeRawUnsafe(sql)
      steps.push(`${label}: OK`)
    } catch (err: any) {
      const msg = String(err?.message ?? err)
      if (msg.includes('already exists')) {
        steps.push(`${label}: ya existía, sin cambios`)
      } else {
        steps.push(`${label}: ERROR — ${msg}`)
        throw err
      }
    }
  }

  try {
    await run('Empresa.tecnicoId columna', `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "tecnicoId" INTEGER`)
    await run('Empresa.tecnicoId índice', `CREATE INDEX IF NOT EXISTS "Empresa_tecnicoId_idx" ON "Empresa"("tecnicoId")`)
    await run(
      'Empresa.tecnicoId foreign key',
      `ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE`
    )

    await run('Predio.tecnicoId columna', `ALTER TABLE "Predio" ADD COLUMN IF NOT EXISTS "tecnicoId" INTEGER`)
    await run('Predio.tecnicoId índice', `CREATE INDEX IF NOT EXISTS "Predio_tecnicoId_idx" ON "Predio"("tecnicoId")`)
    await run(
      'Predio.tecnicoId foreign key',
      `ALTER TABLE "Predio" ADD CONSTRAINT "Predio_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE`
    )

    return NextResponse.json({
      ok: true,
      steps,
      mensaje: 'Migración aplicada correctamente. Ya puedes asignar técnicos a empresas y predios.',
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, steps, error: err?.message ?? String(err) }, { status: 500 })
  }
}
