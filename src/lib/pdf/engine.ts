import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib'
import type { CampoPDF } from '@/types/pdf'

const FUENTES_ESTANDAR: Record<string, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  'Helvetica-Bold': StandardFonts.HelveticaBold,
  'Times-Roman': StandardFonts.TimesRoman,
  'Times-Bold': StandardFonts.TimesRomanBold,
  Courier: StandardFonts.Courier,
}

const TAMANO_DEFAULT = 10

// Motor genérico: no sabe nada de prendas ni formularios específicos.
// No carga un PDF de fondo: genera páginas en blanco del tamaño indicado
// y superpone el texto, para imprimir sobre el papel oficial físico.
export async function generarPDF(
  campos: CampoPDF[],
  tamanoPagina: [number, number],
  cantidadPaginas: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const paginas = Array.from({ length: cantidadPaginas }, () => pdfDoc.addPage(tamanoPagina))

  const fuentesEmbebidas = new Map<StandardFonts, PDFFont>()
  const obtenerFuente = async (nombre?: string): Promise<PDFFont> => {
    const fuenteEstandar = FUENTES_ESTANDAR[nombre ?? 'Helvetica'] ?? StandardFonts.Helvetica
    const cacheada = fuentesEmbebidas.get(fuenteEstandar)
    if (cacheada) return cacheada

    const fuente = await pdfDoc.embedFont(fuenteEstandar)
    fuentesEmbebidas.set(fuenteEstandar, fuente)
    return fuente
  }

  for (const campo of campos) {
    if (!campo.texto) continue

    const pagina = paginas[(campo.pagina ?? 1) - 1]
    const fuente = await obtenerFuente(campo.font)
    pagina.drawText(campo.texto, {
      x: campo.x,
      y: campo.y,
      size: campo.size ?? TAMANO_DEFAULT,
      font: fuente,
      color: rgb(0, 0, 0),
    })
  }

  return pdfDoc.save()
}
