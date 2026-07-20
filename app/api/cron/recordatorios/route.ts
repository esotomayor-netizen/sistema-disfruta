export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { procesarRecordatorios } from '@/lib/notify'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const count = await procesarRecordatorios()
    console.log(`[cron:recordatorios] procesadas ${count} oportunidades`)
    return NextResponse.json({ ok: true, oportunidadesProcesadas: count })
  } catch (err) {
    console.error('[cron:recordatorios]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
