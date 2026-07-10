import { type NextRequest, NextResponse } from 'next/server'
import { generarPDF } from '@/lib/pdf/engine'
import { ST03_CANTIDAD_PAGINAS, ST03_TAMANO_PAGINA, buildST03Fields } from '@/lib/pdf/templates/st03'
import { getPrendaParaImprimir, mapWizardAPrendaParaImprimir } from '@/lib/services/prendaService'
import type { PrendaWizardPayload } from '@/types'

export async function GET(request: NextRequest) {
  const prendaId = request.nextUrl.searchParams.get('prendaId') ?? 'test'

  const prenda = await getPrendaParaImprimir(prendaId)
  const campos = buildST03Fields(prenda)
  const pdfGenerado = await generarPDF(campos, ST03_TAMANO_PAGINA, ST03_CANTIDAD_PAGINAS)

  return new NextResponse(Buffer.from(pdfGenerado), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="st03-${prendaId}.pdf"`,
    },
  })
}

// Genera el ST-03 a partir de los datos cargados en el wizard de nueva
// prenda (src/app/(dashboard)/prendas/nueva/). Todavía no persiste en Supabase.
export async function POST(request: NextRequest) {
  try {
    const wizard = (await request.json()) as PrendaWizardPayload
    const prenda = mapWizardAPrendaParaImprimir(wizard)
    const campos = buildST03Fields(prenda)
    const pdfGenerado = await generarPDF(campos, ST03_TAMANO_PAGINA, ST03_CANTIDAD_PAGINAS)

    return new NextResponse(Buffer.from(pdfGenerado), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="st03-prenda.pdf"',
      },
    })
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al generar el PDF'
    return NextResponse.json({ error: mensaje }, { status: 400 })
  }
}
