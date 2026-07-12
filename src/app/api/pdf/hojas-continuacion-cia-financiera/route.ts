import { type NextRequest, NextResponse } from 'next/server'
import {
  buildHojasContinuacionCiaFinancieraDocumento,
  mapWizardAPrendaParaImprimir,
} from '@/lib/services/prendaService'
import type { PrendaWizardPayload } from '@/types'

// Genera las hojas de continuación del contrato FCA Compañía Financiera
// (páginas 1 y 2 siempre + 3 y 4 si hay codeudor) a partir de los datos
// cargados en el wizard de nueva prenda. Documento separado del contrato
// (/api/pdf/contrato-cia-financiera): el DNTR exige que las hojas de
// continuación se presenten por duplicado, a diferencia del contrato
// (original + 1 copia no negociable). Todavía no persiste en Supabase.
export async function POST(request: NextRequest) {
  try {
    const wizard = (await request.json()) as PrendaWizardPayload
    const prenda = mapWizardAPrendaParaImprimir(wizard)
    const pdfGenerado = await buildHojasContinuacionCiaFinancieraDocumento(prenda)

    return new NextResponse(Buffer.from(pdfGenerado), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="hojas-continuacion-cia-financiera.pdf"',
      },
    })
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al generar el PDF'
    return NextResponse.json({ error: mensaje }, { status: 400 })
  }
}
