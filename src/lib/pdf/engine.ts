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
// Recibe un PDF base y una lista de campos con texto + coordenadas,
// y devuelve el PDF resultante con el texto superpuesto en la página 1.
export async function generarPDF(
  pdfBase: Buffer | Uint8Array,
  campos: CampoPDF[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBase)
  const pagina = pdfDoc.getPage(0)

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
