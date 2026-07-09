import { type NextRequest, NextResponse } from 'next/server'
import { generarPDF } from '@/lib/pdf/engine'
import { ST03_CANTIDAD_PAGINAS, ST03_TAMANO_PAGINA, buildST03Fields } from '@/lib/pdf/templates/st03'
import { getPrendaParaImprimir } from '@/lib/services/prendaService'

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
