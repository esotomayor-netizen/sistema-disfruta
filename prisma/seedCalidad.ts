import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const dataPath = path.join(__dirname, 'calidad_data.json')
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  await prisma.recepcionCalidad.deleteMany()

  const records = rawData.map((d: Record<string, unknown>) => ({
    ...d,
    fechaMuestra: new Date(d.fechaMuestra as string),
  }))

  await prisma.recepcionCalidad.createMany({ data: records })

  const count = await prisma.recepcionCalidad.count()
  console.log(`✅ Importadas ${count} recepciones de calidad.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
