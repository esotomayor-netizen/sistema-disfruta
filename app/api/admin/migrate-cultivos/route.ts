export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

async function run(steps: string[], label: string, sql: string) {
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

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo supervisores pueden ejecutar esta acción' }, { status: 403 })
  }

  const steps: string[] = []
  try {
    await run(steps, 'Crear tabla PredioCultivo', `
      CREATE TABLE IF NOT EXISTS "PredioCultivo" (
        "id" SERIAL PRIMARY KEY,
        "predioId" INTEGER NOT NULL,
        "cultivo" TEXT NOT NULL,
        "variedades" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    await run(steps, 'FK PredioCultivo.predioId', `
      ALTER TABLE "PredioCultivo"
      ADD CONSTRAINT "PredioCultivo_predioId_fkey"
      FOREIGN KEY ("predioId") REFERENCES "Predio"("id") ON DELETE CASCADE;
    `)

    await run(steps, 'Unique (predioId, cultivo)', `
      ALTER TABLE "PredioCultivo"
      ADD CONSTRAINT "PredioCultivo_predioId_cultivo_key"
      UNIQUE ("predioId", "cultivo");
    `)

    await run(steps, 'Índice predioId', `
      CREATE INDEX IF NOT EXISTS "PredioCultivo_predioId_idx" ON "PredioCultivo"("predioId");
    `)

    await run(steps, 'Migrar datos existentes (Predio.cultivo → PredioCultivo)', `
      INSERT INTO "PredioCultivo" ("predioId", "cultivo", "variedades", "createdAt", "updatedAt")
      SELECT "id", "cultivo", "variedades", now(), now()
      FROM "Predio"
      WHERE "cultivo" IS NOT NULL
      ON CONFLICT ("predioId", "cultivo") DO NOTHING;
    `)

    await run(steps, 'Eliminar columna Predio.cultivo', `
      ALTER TABLE "Predio" DROP COLUMN IF EXISTS "cultivo";
    `)

    await run(steps, 'Eliminar columna Predio.variedades', `
      ALTER TABLE "Predio" DROP COLUMN IF EXISTS "variedades";
    `)

    return NextResponse.json({ ok: true, steps, mensaje: 'Migración aplicada correctamente. Ya puedes registrar predios con varias especies.' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, steps, error: String(err?.message ?? err) }, { status: 500 })
  }
}
