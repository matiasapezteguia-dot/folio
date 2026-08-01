import { type NextRequest, NextResponse } from 'next/server'
import { generarPDF } from '@/lib/pdf/engine'
import { ST02_CANTIDAD_PAGINAS, ST02_TAMANO_PAGINA, buildST02Fields } from '@/lib/pdf/templates/st02'
import { aplicarOffsetsImpresion, type OffsetCampo } from '@/lib/pdf/offsetsImpresion'
import { mapWizardAPrendaParaImprimir } from '@/lib/services/prendaService'
import type { PrendaWizardPayload } from '@/types'

// offsets no es parte de PrendaWizardPayload (datos del trámite): es
// metadata del editor de ajuste de impresión, ver PasoAjusteImpresion.tsx y
// campo_override.sql.
interface PeticionPdfST02 extends PrendaWizardPayload {
  offsets?: Record<string, OffsetCampo>
}

// Genera el ST-02 a partir de los datos cargados en el wizard de nueva
// prenda (src/app/(dashboard)/prendas/nueva/). Todavía no persiste en Supabase.
//
// offsets trae el ajuste de impresión de la impresora seleccionada tal como
// quedó en el store del wizard al momento de descargar
// (PasoAjusteImpresion.tsx) — mismo patrón que api/pdf/st03/route.ts. Antes
// este endpoint lo ignoraba por completo: el PDF descargado siempre salía
// con las coordenadas base del template, sin importar lo que el usuario
// ajustara en el editor visual.
export async function POST(request: NextRequest) {
  try {
    const { offsets, ...wizard } = (await request.json()) as PeticionPdfST02
    const prenda = mapWizardAPrendaParaImprimir(wizard)
    const campos = aplicarOffsetsImpresion(buildST02Fields(prenda), offsets)
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
