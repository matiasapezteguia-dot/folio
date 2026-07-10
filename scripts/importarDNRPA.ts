// Importa marcas y modelos DNRPA a Supabase en lotes, evitando el timeout
// de ejecutar scripts/referencias/dnrpa_modelos.sql (25.000 inserts individuales)
// directo en el SQL Editor de Supabase.
// Variables de entorno cargadas vía `tsx --env-file=.env.local` (ver package.json).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

interface FilaDNRPA {
  codigoMarca: string
  descripcionMarca: string
  codigoModelo: string
  descripcionModelo: string
  codigoTipo: string
  descripcionTipo: string
}

const TAMANO_LOTE = 500

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error(
    'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local'
  )
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)

function partirEnLotes<T>(items: T[], tamano: number): T[][] {
  const lotes: T[][] = []
  for (let i = 0; i < items.length; i += tamano) {
    lotes.push(items.slice(i, i + tamano))
  }
  return lotes
}

async function insertarMarcas(filas: FilaDNRPA[]): Promise<void> {
  const marcasPorCodigo = new Map<string, string>()
  for (const fila of filas) {
    if (!marcasPorCodigo.has(fila.codigoMarca)) {
      marcasPorCodigo.set(fila.codigoMarca, fila.descripcionMarca)
    }
  }

  const marcas = Array.from(marcasPorCodigo.entries()).map(([codigo_dnrpa, nombre]) => ({
    codigo_dnrpa,
    nombre,
  }))

  const lotes = partirEnLotes(marcas, TAMANO_LOTE)
  let insertadas = 0

  for (const lote of lotes) {
    const { error } = await supabase
      .from('marca_vehiculo')
      .upsert(lote, { onConflict: 'codigo_dnrpa', ignoreDuplicates: true })

    if (error) {
      console.error(`Error insertando lote de marcas (${lote.length} registros): ${error.message}`)
      await insertarUnoAUno('marca_vehiculo', 'codigo_dnrpa', lote)
    }

    insertadas += lote.length
    console.log(`Insertando marcas ${insertadas}/${marcas.length}...`)
  }
}

async function insertarUnoAUno(
  tabla: string,
  columnaConflicto: string,
  registros: Record<string, unknown>[]
): Promise<void> {
  for (const registro of registros) {
    const { error } = await supabase
      .from(tabla)
      .upsert(registro, { onConflict: columnaConflicto, ignoreDuplicates: true })

    if (error) {
      console.error(`  Error en registro individual ${JSON.stringify(registro)}: ${error.message}`)
    }
  }
}

async function cargarMapaMarcas(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>()
  let desde = 0
  const tamanoPagina = 1000

  for (;;) {
    const { data, error } = await supabase
      .from('marca_vehiculo')
      .select('id, codigo_dnrpa')
      .range(desde, desde + tamanoPagina - 1)

    if (error) {
      throw new Error(`Error leyendo marca_vehiculo: ${error.message}`)
    }
    if (!data || data.length === 0) break

    for (const fila of data as { id: string; codigo_dnrpa: string }[]) {
      mapa.set(fila.codigo_dnrpa, fila.id)
    }

    if (data.length < tamanoPagina) break
    desde += tamanoPagina
  }

  return mapa
}

async function insertarModelos(filas: FilaDNRPA[]): Promise<void> {
  const idPorCodigoMarca = await cargarMapaMarcas()

  const modelosPorClave = new Map<string, { nombre: string; codigo_dnrpa: string; id_marca: string }>()
  for (const fila of filas) {
    const idMarca = idPorCodigoMarca.get(fila.codigoMarca)
    if (!idMarca) {
      console.error(
        `  Sin marca resuelta para codigoMarca=${fila.codigoMarca} (modelo ${fila.descripcionModelo}), se omite`
      )
      continue
    }

    const clave = `${fila.codigoMarca}:${fila.codigoModelo}`
    if (!modelosPorClave.has(clave)) {
      modelosPorClave.set(clave, {
        nombre: fila.descripcionModelo,
        codigo_dnrpa: fila.codigoModelo,
        id_marca: idMarca,
      })
    }
  }

  const modelos = Array.from(modelosPorClave.values())
  const lotes = partirEnLotes(modelos, TAMANO_LOTE)
  let insertados = 0

  for (const lote of lotes) {
    const { error } = await supabase
      .from('modelo_vehiculo')
      .upsert(lote, { onConflict: 'id_marca,codigo_dnrpa', ignoreDuplicates: true })

    if (error) {
      console.error(`Error insertando lote de modelos (${lote.length} registros): ${error.message}`)
      await insertarUnoAUno('modelo_vehiculo', 'id_marca,codigo_dnrpa', lote)
    }

    insertados += lote.length
    console.log(`Insertando modelos ${insertados}/${modelos.length}...`)
  }
}

async function cargarMapaModelos(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>()
  let desde = 0
  const tamanoPagina = 1000

  for (;;) {
    const { data, error } = await supabase
      .from('modelo_vehiculo')
      .select('id, id_marca, codigo_dnrpa')
      .range(desde, desde + tamanoPagina - 1)

    if (error) {
      throw new Error(`Error leyendo modelo_vehiculo: ${error.message}`)
    }
    if (!data || data.length === 0) break

    for (const fila of data as { id: string; id_marca: string; codigo_dnrpa: string }[]) {
      mapa.set(`${fila.id_marca}:${fila.codigo_dnrpa}`, fila.id)
    }

    if (data.length < tamanoPagina) break
    desde += tamanoPagina
  }

  return mapa
}

async function insertarTipos(filas: FilaDNRPA[]): Promise<void> {
  const idPorCodigoMarca = await cargarMapaMarcas()
  const idModeloPorClaveMarcaModelo = await cargarMapaModelos()

  const tiposPorClave = new Map<string, { id_modelo: string; codigo_tipo: string; descripcion_tipo: string }>()
  for (const fila of filas) {
    const idMarca = idPorCodigoMarca.get(fila.codigoMarca)
    if (!idMarca) {
      console.error(
        `  Sin marca resuelta para codigoMarca=${fila.codigoMarca} (tipo ${fila.descripcionTipo}), se omite`
      )
      continue
    }

    const idModelo = idModeloPorClaveMarcaModelo.get(`${idMarca}:${fila.codigoModelo}`)
    if (!idModelo) {
      console.error(
        `  Sin modelo resuelto para codigoMarca=${fila.codigoMarca}, codigoModelo=${fila.codigoModelo} (tipo ${fila.descripcionTipo}), se omite`
      )
      continue
    }

    const clave = `${idModelo}:${fila.codigoTipo}`
    if (!tiposPorClave.has(clave)) {
      tiposPorClave.set(clave, {
        id_modelo: idModelo,
        codigo_tipo: fila.codigoTipo,
        descripcion_tipo: fila.descripcionTipo,
      })
    }
  }

  const tipos = Array.from(tiposPorClave.values())
  const lotes = partirEnLotes(tipos, TAMANO_LOTE)
  let insertados = 0

  for (const lote of lotes) {
    const { error } = await supabase
      .from('modelo_vehiculo_tipo')
      .upsert(lote, { onConflict: 'id_modelo,codigo_tipo', ignoreDuplicates: true })

    if (error) {
      console.error(`Error insertando lote de tipos (${lote.length} registros): ${error.message}`)
      await insertarUnoAUno('modelo_vehiculo_tipo', 'id_modelo,codigo_tipo', lote)
    }

    insertados += lote.length
    console.log(`Insertando tipos ${insertados}/${tipos.length}...`)
  }
}

async function tiposEstanVacios(): Promise<boolean> {
  const { count, error } = await supabase
    .from('modelo_vehiculo_tipo')
    .select('id', { count: 'exact', head: true })

  if (error) {
    throw new Error(`Error consultando modelo_vehiculo_tipo: ${error.message}`)
  }

  return (count ?? 0) === 0
}

async function main(): Promise<void> {
  const soloTipos = process.argv.includes('--solo-tipos')

  const rutaJson = path.join(process.cwd(), 'scripts', 'referencias', 'dnrpa_modelos.json')
  const filas: FilaDNRPA[] = JSON.parse(readFileSync(rutaJson, 'utf-8'))

  console.log(`Leídas ${filas.length} filas de dnrpa_modelos.json`)

  if (soloTipos) {
    console.log('--- Tipos (--solo-tipos) ---')
    await insertarTipos(filas)
    console.log('Importación finalizada.')
    return
  }

  console.log('--- Marcas ---')
  await insertarMarcas(filas)

  console.log('--- Modelos ---')
  await insertarModelos(filas)

  if (await tiposEstanVacios()) {
    console.log('--- Tipos (tabla vacía, importando automáticamente) ---')
    await insertarTipos(filas)
  }

  console.log('Importación finalizada.')
}

main().catch((error) => {
  console.error('Error fatal en la importación:', error)
  process.exit(1)
})
