import { type NextRequest, NextResponse } from 'next/server'
import { generarPDF } from '@/lib/pdf/engine'
import { ST02_CANTIDAD_PAGINAS, ST02_TAMANO_PAGINA, buildST02Fields } from '@/lib/pdf/templates/st02'
import { mapWizardAPrendaParaImprimir } from '@/lib/services/prendaService'
import type { PrendaWizardPayload } from '@/types'

// Genera el ST-02 a partir de los datos cargados en el wizard de nueva
// prenda (src/app/(dashboard)/prendas/nueva/). Todavía no persiste en Supabase.
export async function POST(request: NextRequest) {
  try {
    const wizard = (await request.json()) as PrendaWizardPayload
    const prenda = mapWizardAPrendaParaImprimir(wizard)
    const campos = buildST02Fields(prenda)
    const pdfGenerado = await generarPDF(campos, ST02_TAMANO_PAGINA, ST02_CANTIDAD_PAGINAS)

    return new NextResponse(Buffer.from(pdfGenerado), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="st02-prenda.pdf"',
      },
    })
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al generar el PDF'
    return NextResponse.json({ error: mensaje }, { status: 400 })
  }
}
