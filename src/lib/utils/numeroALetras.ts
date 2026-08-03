const UNIDADES = [
  '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
  'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
  'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS',
  'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
]

const DECENAS = [
  '', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
]

const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS',
  'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
]

function convertirGrupo(numero: number): string {
  if (numero === 0) return ''
  if (numero === 100) return 'CIEN'

  const centena = Math.floor(numero / 100)
  const resto = numero % 100

  let texto = centena > 0 ? CENTENAS[centena] : ''

  if (resto > 0) {
    if (texto) texto += ' '
    if (resto <= 29) {
      texto += UNIDADES[resto]
    } else {
      const decena = Math.floor(resto / 10)
      const unidad = resto % 10
      texto += unidad === 0 ? DECENAS[decena] : `${DECENAS[decena]} Y ${UNIDADES[unidad]}`
    }
  }

  return texto
}

// Convierte un monto a su expresión en letras para formularios legales,
// ej: numeroALetras(4500000) -> "CUATRO MILLONES QUINIENTOS MIL PESOS CON 00/100"
// moneda 'usd' usa DÓLAR/DÓLARES en vez de PESO/PESOS — antes quedaba
// hardcodeado a pesos aunque el contrato fuera en USD.
export function numeroALetras(monto: number, moneda: 'pesos' | 'usd' = 'pesos'): string {
  const entero = Math.floor(Math.abs(monto))
  const centavos = Math.round((Math.abs(monto) - entero) * 100)
  const centavosTexto = String(centavos).padStart(2, '0')
  const [singular, plural] = moneda === 'usd' ? ['DÓLAR', 'DÓLARES'] : ['PESO', 'PESOS']

  if (entero === 0) return `CERO ${plural} CON ${centavosTexto}/100`

  const millones = Math.floor(entero / 1_000_000)
  const miles = Math.floor((entero % 1_000_000) / 1000)
  const cientos = entero % 1000

  const partes: string[] = []

  if (millones > 0) {
    // convertirGrupo() solo maneja 0-999 (CENTENAS tiene 10 posiciones) — a
    // diferencia de miles/cientos, millones no tiene techo (viene de
    // entero / 1_000_000 sin acotar), así que para montos de mil millones o
    // más hay que descomponerlo en miles-de-millón + resto antes de
    // convertirlo, igual que se hace con entero más abajo.
    const milesDeMillones = Math.floor(millones / 1000)
    const restoMillones = millones % 1000
    const textoMillones = [
      milesDeMillones > 0 ? (milesDeMillones === 1 ? 'MIL' : `${convertirGrupo(milesDeMillones)} MIL`) : '',
      restoMillones > 0 ? convertirGrupo(restoMillones) : '',
    ]
      .filter(Boolean)
      .join(' ')

    partes.push(millones === 1 ? 'UN MILLÓN' : `${textoMillones} MILLONES`)
  }

  if (miles > 0) {
    partes.push(miles === 1 ? 'MIL' : `${convertirGrupo(miles)} MIL`)
  }

  if (cientos > 0) {
    partes.push(convertirGrupo(cientos))
  }

  const unidadMonetaria = entero === 1 ? singular : plural
  return `${partes.join(' ')} ${unidadMonetaria} CON ${centavosTexto}/100`
}
