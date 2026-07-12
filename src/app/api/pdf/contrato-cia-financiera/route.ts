import { type NextRequest, NextResponse } from 'next/server'
import { buildContratoCiaFinancieraDocumento, mapWizardAPrendaParaImprimir } from '@/lib/services/prendaService'
import type { PrendaWizardPayload } from '@/types'

// Genera el contrato prendario FCA Compañía Financiera (página 1 + página 2
// si corresponde) a partir de los datos cargados en el wizard de nueva
// prenda. Documento separado de las hojas de continuación
// (/api/pdf/hojas-continuacion-cia-financiera): el DNTR exige un régimen de
// copias distinto para cada uno (contrato: original + 1 copia no
// negociable; hojas de continuación: por duplicado). Todavía no persiste
// en Supabase.
export async function POST(request: NextRequest) {
  try {
    const wizard = (await request.json()) as PrendaWizardPayload
    const prenda = mapWizardAPrendaParaImprimir(wizard)
    const pdfGenerado = await buildContratoCiaFinancieraDocumento(prenda)

    return new NextResponse(Buffer.from(pdfGenerado), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="contrato-cia-financiera.pdf"',
      },
    })
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al generar el PDF'
    return NextResponse.json({ error: mensaje }, { status: 400 })
  }
}
