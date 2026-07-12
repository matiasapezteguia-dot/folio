import { type NextRequest, NextResponse } from 'next/server'
import {
  buildHojasContinuacionPlanAhorroDocumento,
  mapWizardAPrendaParaImprimir,
} from '@/lib/services/prendaService'
import type { PrendaWizardPayload } from '@/types'

// Genera las hojas de continuación del contrato FCA Plan de Ahorro (hoja 1
// siempre + hoja 2 si hay garante + hoja 3 si corresponde asentimiento
// conyugal) a partir de los datos cargados en el wizard de nueva prenda.
// Documento separado del contrato (/api/pdf/contrato-plan-ahorro): el DNTR
// exige que las hojas de continuación se presenten por duplicado, a
// diferencia del contrato (original + 1 copia no negociable). Todavía no
// persiste en Supabase.
export async function POST(request: NextRequest) {
  try {
    const wizard = (await request.json()) as PrendaWizardPayload
    const prenda = mapWizardAPrendaParaImprimir(wizard)
    const pdfGenerado = await buildHojasContinuacionPlanAhorroDocumento(prenda)

    return new NextResponse(Buffer.from(pdfGenerado), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="hojas-continuacion-plan-ahorro.pdf"',
      },
    })
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al generar el PDF'
    return NextResponse.json({ error: mensaje }, { status: 400 })
  }
}
