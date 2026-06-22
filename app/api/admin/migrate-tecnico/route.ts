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
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "tecnicoId" INTEGER`)
    steps.push('Empresa.tecnicoId: columna OK')
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Empresa_tecnicoId_idx" ON "Empresa"("tecnicoId")`)
    steps.push('Empresa.tecnicoId: índice OK')
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_tecnicoId_fkey"
          FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)
    steps.push('Empresa.tecnicoId: foreign key OK')

    await prisma.$executeRawUnsafe(`ALTER TABLE "Predio" ADD COLUMN IF NOT EXISTS "tecnicoId" INTEGER`)
    steps.push('Predio.tecnicoId: columna OK')
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Predio_tecnicoId_idx" ON "Predio"("tecnicoId")`)
    steps.push('Predio.tecnicoId: índice OK')
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Predio" ADD CONSTRAINT "Predio_tecnicoId_fkey"
          FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)
    steps.push('Predio.tecnicoId: foreign key OK')

    return NextResponse.json({
      ok: true,
      steps,
      mensaje: 'Migración aplicada correctamente. Ya puedes asignar técnicos a empresas y predios.',
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, steps, error: err.message }, { status: 500 })
  }
}
