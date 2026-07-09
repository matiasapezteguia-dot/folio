import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'
import { generarPDF } from '@/lib/pdf/engine'
import { buildST03Fields } from '@/lib/pdf/templates/st03'
import { getPrendaParaImprimir } from '@/lib/services/prendaService'

const ST03_BASE_PATH = path.join(process.cwd(), 'public', 'forms', 'st03.pdf')

export async function GET(request: NextRequest) {
  const prendaId = request.nextUrl.searchParams.get('prendaId') ?? 'test'

  const prenda = await getPrendaParaImprimir(prendaId)
  const campos = buildST03Fields(prenda)
  const pdfBase = await readFile(ST03_BASE_PATH)
  const pdfGenerado = await generarPDF(pdfBase, campos)

  return new NextResponse(Buffer.from(pdfGenerado), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="st03-${prendaId}.pdf"`,
    },
  })
}
