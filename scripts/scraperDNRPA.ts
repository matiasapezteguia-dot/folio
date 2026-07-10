// Scraper de la base pública Marca-Tipo-Modelo del DNRPA.
// Recorre las marcas disponibles y, para cada una, obtiene todos los
// modelos y tipos asociados. Genera un JSON crudo (dnrpa_modelos.json)
// y un SQL de carga para marca_vehiculo / modelo_vehiculo (dnrpa_modelos.sql).
//
// El sitio no expone un <select> con todas las marcas: hay que buscarlas
// por coincidencia de texto en el código. Como todo código de marca está
// formado por dígitos 0-9, se barren los 10 dígitos y se deduplica por
// código para cubrir el universo completo.
//
// Uso: npx tsx scripts/scraperDNRPA.ts

import path from 'node:path'
import { writeFile } from 'node:fs/promises'
import axios from 'axios'
import * as cheerio from 'cheerio'

interface Marca {
  codigo: string
  descripcion: string
}

interface ModeloTipo {
  codigoModelo: string
  descripcionModelo: string
  codigoTipo: string
  descripcionTipo: string
}

interface RegistroDNRPA {
  codigoMarca: string
  descripcionMarca: string
  codigoModelo: string
  descripcionModelo: string
  codigoTipo: string
  descripcionTipo: string
}

const URL_PORTAL = 'https://www.dnrpa.gov.ar/portal_dnrpa/ada.php?marca-tipo-mod=true'
const URL_BUSQUEDA_MARCA = 'https://www.dnrpa.gov.ar/ADA/consultas/ADMTM01.php'
const URL_BUSQUEDA_MODELO = 'https://www.dnrpa.gov.ar/ADA/consultas/ADMTM02.php'
const DIGITOS_BUSQUEDA = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const DELAY_MS = 500
const USER_AGENT = 'Mozilla/5.0 (compatible; FolioScraper/1.0)'

const RUTA_JSON = path.join(process.cwd(), 'scripts', 'referencias', 'dnrpa_modelos.json')
const RUTA_SQL = path.join(process.cwd(), 'scripts', 'referencias', 'dnrpa_modelos.sql')

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function limpiarTexto(texto: string): string {
  return texto.replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
}

function escaparSQL(texto: string): string {
  return texto.replace(/'/g, "''")
}

async function obtenerMarcas(): Promise<Marca[]> {
  const marcasPorCodigo = new Map<string, string>()

  for (const digito of DIGITOS_BUSQUEDA) {
    const { data } = await axios.post(
      URL_BUSQUEDA_MARCA,
      new URLSearchParams({ forma: 'codigo', dato: digito, B1: 'Buscar' }),
      { headers: { 'User-Agent': USER_AGENT } },
    )

    const $ = cheerio.load(data)
    $('select[name="marca"] option[value]').each((_, elemento) => {
      const codigo = $(elemento).attr('value')
      if (!codigo) return

      const descripcion = limpiarTexto($(elemento).text()).replace(new RegExp(`^${codigo}\\s*`), '')
      if (!marcasPorCodigo.has(codigo)) {
        marcasPorCodigo.set(codigo, descripcion)
      }
    })

    await esperar(DELAY_MS)
  }

  return [...marcasPorCodigo.entries()]
    .map(([codigo, descripcion]) => ({ codigo, descripcion }))
    .sort((a, b) => a.codigo.localeCompare(b.codigo))
}

async function obtenerModelosDeMarca(codigoMarca: string): Promise<ModeloTipo[]> {
  const { data } = await axios.post(
    URL_BUSQUEDA_MODELO,
    new URLSearchParams({ marca: codigoMarca, forma: 'codigo', dato: '', B1: 'Buscar' }),
    { headers: { 'User-Agent': USER_AGENT } },
  )

  const $ = cheerio.load(data)
  const modelos: ModeloTipo[] = []

  $('tr').each((_, fila) => {
    const celdas = $(fila).find('td')
    if (celdas.length !== 4) return

    const codigoModelo = limpiarTexto($(celdas.get(0)).text())
    const descripcionModelo = limpiarTexto($(celdas.get(1)).text())
    const codigoTipo = limpiarTexto($(celdas.get(2)).text())
    const descripcionTipo = limpiarTexto($(celdas.get(3)).text())

    if (!/^\d+$/.test(codigoModelo) || !/^\d+$/.test(codigoTipo)) return

    modelos.push({ codigoModelo, descripcionModelo, codigoTipo, descripcionTipo })
  })

  return modelos
}

function generarSQL(marcas: Marca[], registros: RegistroDNRPA[]): string {
  const modelosPorClave = new Map<string, { codigoMarca: string; codigoModelo: string; descripcionModelo: string }>()
  for (const registro of registros) {
    const clave = `${registro.codigoMarca}-${registro.codigoModelo}`
    if (!modelosPorClave.has(clave)) {
      modelosPorClave.set(clave, {
        codigoMarca: registro.codigoMarca,
        codigoModelo: registro.codigoModelo,
        descripcionModelo: registro.descripcionModelo,
      })
    }
  }

  const lineas: string[] = []

  lineas.push('-- Carga de marcas y modelos desde la base pública Marca-Tipo-Modelo del DNRPA.')
  lineas.push('-- El "tipo" de DNRPA (ej. "SEDAN 3 PUERTAS") es específico por combinación')
  lineas.push('-- marca+modelo y no corresponde al catálogo genérico tipo_vehiculo de Folio;')
  lineas.push('-- por eso no se inserta acá y queda solo en dnrpa_modelos.json.')
  lineas.push('')
  lineas.push('ALTER TABLE marca_vehiculo ADD COLUMN IF NOT EXISTS codigo_dnrpa varchar(3);')
  lineas.push('ALTER TABLE modelo_vehiculo ADD COLUMN IF NOT EXISTS codigo_dnrpa varchar(3);')
  lineas.push('ALTER TABLE modelo_vehiculo ADD COLUMN IF NOT EXISTS id_marca uuid REFERENCES marca_vehiculo(id);')
  lineas.push('')
  lineas.push('CREATE UNIQUE INDEX IF NOT EXISTS ux_marca_vehiculo_codigo_dnrpa ON marca_vehiculo(codigo_dnrpa);')
  lineas.push('CREATE UNIQUE INDEX IF NOT EXISTS ux_modelo_vehiculo_marca_codigo ON modelo_vehiculo(id_marca, codigo_dnrpa);')
  lineas.push('')

  lineas.push('-- Marcas')
  for (const marca of marcas) {
    lineas.push(
      `INSERT INTO marca_vehiculo (nombre, codigo_dnrpa) VALUES ('${escaparSQL(marca.descripcion)}', '${marca.codigo}') ` +
        'ON CONFLICT (codigo_dnrpa) DO NOTHING;',
    )
  }

  lineas.push('')
  lineas.push('-- Modelos')
  for (const modelo of modelosPorClave.values()) {
    lineas.push(
      'INSERT INTO modelo_vehiculo (nombre, codigo_dnrpa, id_marca) ' +
        `SELECT '${escaparSQL(modelo.descripcionModelo)}', '${modelo.codigoModelo}', id FROM marca_vehiculo ` +
        `WHERE codigo_dnrpa = '${modelo.codigoMarca}' ` +
        'ON CONFLICT (id_marca, codigo_dnrpa) DO NOTHING;',
    )
  }

  return lineas.join('\n') + '\n'
}

async function main() {
  await axios.get(URL_PORTAL, { headers: { 'User-Agent': USER_AGENT } })

  console.log('Obteniendo listado de marcas...')
  const marcas = await obtenerMarcas()
  console.log(`Se encontraron ${marcas.length} marcas.\n`)

  const registros: RegistroDNRPA[] = []

  for (let i = 0; i < marcas.length; i++) {
    const marca = marcas[i]
    console.log(`Procesando marca ${i + 1} de ${marcas.length}: ${marca.descripcion}...`)

    try {
      const modelos = await obtenerModelosDeMarca(marca.codigo)
      for (const modelo of modelos) {
        registros.push({
          codigoMarca: marca.codigo,
          descripcionMarca: marca.descripcion,
          codigoModelo: modelo.codigoModelo,
          descripcionModelo: modelo.descripcionModelo,
          codigoTipo: modelo.codigoTipo,
          descripcionTipo: modelo.descripcionTipo,
        })
      }
    } catch (err) {
      const error = err as Error
      console.error(`  Error al procesar marca ${marca.codigo}: ${error.message}`)
    }

    await esperar(DELAY_MS)
  }

  await writeFile(RUTA_JSON, JSON.stringify(registros, null, 2), 'utf-8')

  const sql = generarSQL(marcas, registros)
  await writeFile(RUTA_SQL, sql, 'utf-8')

  const modelosUnicos = new Set(registros.map((r) => `${r.codigoMarca}-${r.codigoModelo}`))

  console.log('')
  console.log('--- Resumen ---')
  console.log(`Marcas procesadas: ${marcas.length}`)
  console.log(`Modelos únicos: ${modelosUnicos.size}`)
  console.log(`Registros marca-modelo-tipo: ${registros.length}`)
  console.log(`JSON: ${RUTA_JSON}`)
  console.log(`SQL: ${RUTA_SQL}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
