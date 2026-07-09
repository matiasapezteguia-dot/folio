// Extrae { texto, x, y, pagina } de los PDFs de referencia de Autoforms
// para calibrar las coordenadas del template ST-03.
//
// Uso: npx tsx scripts/extraerCoordenadas.ts

import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

interface ItemExtraido {
  texto: string
  x: number
  y: number
  pagina: number
}

const ARCHIVOS = [
  'st03_pagina1_datos_reales.pdf',
  'st03_pagina2_datos_reales.pdf',
]

async function extraerDeArchivo(rutaAbsoluta: string, numeroPagina: number): Promise<ItemExtraido[]> {
  const data = await readFile(rutaAbsoluta)
  const doc = await getDocument({ data: new Uint8Array(data) }).promise

  const items: ItemExtraido[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i)
    const contenido = await pagina.getTextContent()

    for (const item of contenido.items) {
      if (!('str' in item)) continue
      const texto = item.str.trim()
      if (!texto) continue

      // transform: [scaleX, skewY, skewX, scaleY, x, y] en espacio PDF
      // (origen abajo-izquierda), igual que pdf-lib.
      const [, , , , x, y] = item.transform

      items.push({
        texto,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        pagina: numeroPagina,
      })
    }
  }

  return items
}

async function main() {
  const todos: ItemExtraido[] = []

  for (let idx = 0; idx < ARCHIVOS.length; idx++) {
    const ruta = path.join(process.cwd(), 'scripts', 'referencias', ARCHIVOS[idx])
    const items = await extraerDeArchivo(ruta, idx + 1)
    todos.push(...items)
  }

  // Orden: página ascendente, luego Y descendente (arriba -> abajo), luego X ascendente
  todos.sort((a, b) => {
    if (a.pagina !== b.pagina) return a.pagina - b.pagina
    if (b.y !== a.y) return b.y - a.y
    return a.x - b.x
  })

  console.log(JSON.stringify(todos, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
