// Genera scripts/referencias/dnrpa_tipos.sql con los INSERT INTO modelo_vehiculo_tipo,
// a partir de dnrpa_modelos.json. Cada INSERT resuelve el id_modelo con un JOIN por
// codigo_dnrpa (mismo patrón que dnrpa_modelos.sql), para no depender de UUIDs fijos.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

interface FilaDNRPA {
  codigoMarca: string
  descripcionMarca: string
  codigoModelo: string
  descripcionModelo: string
  codigoTipo: string
  descripcionTipo: string
}

function escaparTexto(texto: string): string {
  return texto.replace(/'/g, "''")
}

function main(): void {
  const rutaJson = path.join(process.cwd(), 'scripts', 'referencias', 'dnrpa_modelos.json')
  const rutaSql = path.join(process.cwd(), 'scripts', 'referencias', 'dnrpa_tipos.sql')

  const filas: FilaDNRPA[] = JSON.parse(readFileSync(rutaJson, 'utf-8'))

  const tiposPorClave = new Map<string, FilaDNRPA>()
  for (const fila of filas) {
    const clave = `${fila.codigoMarca}:${fila.codigoModelo}:${fila.codigoTipo}`
    if (!tiposPorClave.has(clave)) {
      tiposPorClave.set(clave, fila)
    }
  }

  const tipos = Array.from(tiposPorClave.values())

  const encabezado = `-- Carga de tipos por modelo desde la base pública Marca-Tipo-Modelo del DNRPA.
-- Requiere que modelo_vehiculo_tipo ya exista (ver scripts/referencias/modelo_vehiculo_tipo.sql)
-- y que marca_vehiculo / modelo_vehiculo ya estén cargados (ver dnrpa_modelos.sql / importar-dnrpa).
-- Cada INSERT resuelve id_modelo por JOIN con codigo_dnrpa, no asume UUIDs fijos.

`

  const inserts = tipos
    .map((fila) => {
      const descripcion = escaparTexto(fila.descripcionTipo)
      return (
        `INSERT INTO modelo_vehiculo_tipo (id_modelo, codigo_tipo, descripcion_tipo) ` +
        `SELECT mv.id, '${fila.codigoTipo}', '${descripcion}' ` +
        `FROM modelo_vehiculo mv JOIN marca_vehiculo ma ON ma.id = mv.id_marca ` +
        `WHERE ma.codigo_dnrpa = '${fila.codigoMarca}' AND mv.codigo_dnrpa = '${fila.codigoModelo}' ` +
        `ON CONFLICT (id_modelo, codigo_tipo) DO NOTHING;`
      )
    })
    .join('\n')

  writeFileSync(rutaSql, encabezado + inserts + '\n', 'utf-8')

  console.log(`Leídas ${filas.length} filas de dnrpa_modelos.json`)
  console.log(`Generados ${tipos.length} INSERT (deduplicados por marca+modelo+tipo)`)
  console.log(`Escrito en ${rutaSql}`)
}

main()
