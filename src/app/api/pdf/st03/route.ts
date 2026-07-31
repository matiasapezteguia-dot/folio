import { type NextRequest, NextResponse } from 'next/server'
import { generarPDF } from '@/lib/pdf/engine'
import { ST03_CANTIDAD_PAGINAS, ST03_TAMANO_PAGINA, buildST03Fields } from '@/lib/pdf/templates/st03'
import { aplicarOffsetsImpresion, type OffsetCampo } from '@/lib/pdf/offsetsImpresion'
import { getPrendaParaImprimir, mapWizardAPrendaParaImprimir } from '@/lib/services/prendaService'
import type { PrendaWizardPayload } from '@/types'

// offsets no es parte de PrendaWizardPayload (datos del trámite): es
// metadata del editor de ajuste de impresión, ver PasoAjusteImpresion.tsx y
// campo_override.sql.
interface PeticionPdfST03 extends PrendaWizardPayload {
  offsets?: Record<string, OffsetCampo>
}

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
//
// offsets trae el ajuste de impresión de la impresora seleccionada tal como
// quedó en el store del wizard al momento de descargar
// (PasoAjusteImpresion.tsx) — ya mezcla los defaults guardados en
// campo_override con cualquier ajuste de sesión sin guardar encima, así que
// alcanza con sumarlo una sola vez acá. Antes este endpoint lo ignoraba por
// completo: el PDF descargado siempre salía con las coordenadas base del
// template, sin importar lo que el usuario ajustara en el editor visual.
export async function POST(request: NextRequest) {
  try {
    const { offsets, ...wizard } = (await request.json()) as PeticionPdfST03
    const prenda = mapWizardAPrendaParaImprimir(wizard)
    const campos = aplicarOffsetsImpresion(buildST03Fields(prenda), offsets)
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
