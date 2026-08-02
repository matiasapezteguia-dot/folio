import { type NextRequest, NextResponse } from 'next/server'
import { buildContratoPlanAhorroDocumento, mapWizardAPrendaParaImprimir } from '@/lib/services/prendaService'
import type { OffsetCampo } from '@/lib/pdf/offsetsImpresion'
import type { PrendaWizardPayload } from '@/types'

// offsets no es parte de PrendaWizardPayload (datos del trámite): es
// metadata del editor de ajuste de impresión, ver PasoAjusteImpresion.tsx y
// campo_override.sql. Solo aplica a la página 1 (único CampoPDF.id de este
// documento) — buildContratoPlanAhorroDocumento lo resuelve internamente.
interface PeticionPdfContratoPlanAhorro extends PrendaWizardPayload {
  offsets?: Record<string, OffsetCampo>
}

// Genera el contrato prendario FCA Plan de Ahorro (página 1 + página 2 si
// corresponde) a partir de los datos cargados en el wizard de nueva prenda.
// Documento separado de las hojas de continuación (/api/pdf/hojas-continuacion-plan-ahorro):
// el DNTR exige un régimen de copias distinto para cada uno (contrato:
// original + 1 copia no negociable; hojas de continuación: por duplicado).
// Todavía no persiste en Supabase.
export async function POST(request: NextRequest) {
  try {
    const { offsets, ...wizard } = (await request.json()) as PeticionPdfContratoPlanAhorro
    const prenda = mapWizardAPrendaParaImprimir(wizard)
    const pdfGenerado = await buildContratoPlanAhorroDocumento(prenda, offsets)

    return new NextResponse(Buffer.from(pdfGenerado), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="contrato-plan-ahorro.pdf"',
      },
    })
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al generar el PDF'
    return NextResponse.json({ error: mensaje }, { status: 400 })
  }
}
