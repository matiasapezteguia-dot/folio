// Convierte todos los PDFs de una carpeta a .txt (mismo nombre, misma carpeta).
//
// Uso: npx tsx scripts/convertirPDFs.ts <carpeta>

import path from 'node:path'
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

interface ResultadoConversion {
  nombreArchivo: string
  bytesAntes: number
  bytesDespues: number
}

async function extraerTexto(rutaAbsoluta: string): Promise<string> {
  const data = await readFile(rutaAbsoluta)
  const doc = await getDocument({ data: new Uint8Array(data) }).promise

  const paginas: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i)
    const contenido = await pagina.getTextContent()
    const textoPagina = contenido.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    paginas.push(textoPagina)
  }

  return paginas.join('\n\n')
}

function formatearKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

async function main() {
  const carpeta = process.argv[2]

  if (!carpeta) {
    console.error('Uso: npx tsx scripts/convertirPDFs.ts <carpeta>')
    process.exit(1)
  }

  const rutaCarpeta = path.resolve(carpeta)
  const nombres = await readdir(rutaCarpeta)
  const archivosPDF = nombres.filter((nombre) => nombre.toLowerCase().endsWith('.pdf'))

  if (archivosPDF.length === 0) {
    console.log(`No se encontraron archivos .pdf en ${rutaCarpeta}`)
    return
  }

  const resultados: ResultadoConversion[] = []

  for (const nombreArchivo of archivosPDF) {
    const rutaPDF = path.join(rutaCarpeta, nombreArchivo)
    const rutaTXT = path.join(rutaCarpeta, nombreArchivo.replace(/\.pdf$/i, '.txt'))

    process.stdout.write(`Convirtiendo ${nombreArchivo}... `)

    try {
      const { size: bytesAntes } = await stat(rutaPDF)
      const texto = await extraerTexto(rutaPDF)
      await writeFile(rutaTXT, texto, 'utf-8')
      const { size: bytesDespues } = await stat(rutaTXT)

      console.log(`OK (${formatearKB(bytesAntes)} → ${formatearKB(bytesDespues)})`)
      resultados.push({ nombreArchivo, bytesAntes, bytesDespues })
    } catch (err) {
      const error = err as Error
      console.log(`ERROR (${error.message})`)
    }
  }

  const totalAntes = resultados.reduce((suma, r) => suma + r.bytesAntes, 0)
  const totalDespues = resultados.reduce((suma, r) => suma + r.bytesDespues, 0)

  console.log('')
  console.log('--- Resumen ---')
  console.log(`Archivos procesados: ${resultados.length} de ${archivosPDF.length}`)
  console.log(`Tamaño total antes:  ${formatearKB(totalAntes)}`)
  console.log(`Tamaño total después: ${formatearKB(totalDespues)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
