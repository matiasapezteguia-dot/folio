import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'
import { formatearFechaLarga } from './fechaLarga'

// Tamaño de página oficial del contrato FCA plan de ahorro (Legal, 612×1008pt).
export const CONTRATO_PAG1_TAMANO_PAGINA: [number, number] = [612, 1008]
export const CONTRATO_PAG1_CANTIDAD_PAGINAS = 1

// Coordenadas calibradas cruzando scripts/referencias/contrato/contrato_pag1_campos.pdf
// (overlay con el NOMBRE de cada campo) contra contrato_pag1_datos_reales.pdf
// (mismo overlay con datos reales) — cada (x,y) coincide exactamente entre
// ambos, confirmando la identidad de cada campo.
//
// Campos con posición conocida (PDF de campos) pero sin evidencia real en la
// muestra disponible quedan comentados al final: Cuartel, NombreEst y una
// segunda mención de "ProfesionDEudor" (sin el "2") en una coordenada Y
// distinta a la confirmada.
export function buildContratoPag1Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { contrato, deudores, vehiculo } = data
  const solicitante = deudores[0]
  const { dia, mesTexto, anio } = formatearFechaLarga(contrato.fecha)

  return [
    // Lugar y fecha de celebración — el PDF real separa "Lugar, día de mes" de
    // "año" en dos campos distintos con la misma Y.
    {
      texto: contrato.lugar && dia ? `${contrato.lugar}, ${dia} de ${mesTexto}` : '',
      x: 363.48,
      y: 892.08,
      size: 9,
      pagina: 1,
    },
    { texto: anio, x: 454.68, y: 892.08, size: 9, pagina: 1 },

    { texto: vehiculo.tipo ?? '', x: 347.88, y: 784.68, size: 9, pagina: 1 },

    // Confirmado solo para 0km sin patente ("PRIVADO, modelo año:2026, dominio
    // a consignar."). El caso "usado" con patente real no tiene evidencia
    // todavía — se deja vacío en vez de adivinar el formato.
    {
      texto: formatearUso(vehiculo),
      x: 319.68,
      y: 747.48,
      size: 9,
      pagina: 1,
    },

    // Domicilio real del solicitante/deudor principal
    { texto: solicitante?.provincia ?? '', x: 208.08, y: 732.48, size: 9, pagina: 1 },
    { texto: solicitante?.partido ?? '', x: 99.48, y: 724.08, size: 9, pagina: 1 },
    { texto: solicitante?.localidad ?? '', x: 129.48, y: 706.08, size: 9, pagina: 1 },
    { texto: solicitante?.calle ?? '', x: 262.68, y: 706.08, size: 9, pagina: 1 },

    { texto: capitalizar(solicitante?.estadoCivil), x: 302.88, y: 503.28, size: 9, pagina: 1 },
    { texto: solicitante?.profesion ?? '', x: 386.28, y: 503.28, size: 9, pagina: 1 },
    { texto: solicitante?.nacionalidad ?? '', x: 310.08, y: 494.28, size: 9, pagina: 1 },
    { texto: solicitante?.dni ? `D.N.I.: ${solicitante.dni}` : '', x: 347.88, y: 469.68, size: 9, pagina: 1 },
    { texto: solicitante?.cuit ? `CUIT/CUIL: ${solicitante.cuit}` : '', x: 262.68, y: 455.28, size: 9, pagina: 1 },

    // Sin evidencia real todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 276.48, y: 724.08, size: 9, pagina: 1 }, // Cuartel
    // { texto: '', x: 218.28, y: 714.48, size: 9, pagina: 1 }, // NombreEst
    // { texto: '', x: 386.28, y: 504.48, size: 9, pagina: 1 }, // ProfesionDEudor (variante sin "2", Y distinta a la confirmada)
  ]
}

// El sistema que generó la muestra real usa "PRIVADO" para uso particular
// (no "PARTICULAR"): confirmado contra contrato_pag1_datos_reales.pdf. No hay
// evidencia real para "comercial" — se deja sin mapear en vez de adivinar.
function formatearUso(vehiculo: PrendaParaImprimir['vehiculo']): string {
  if (vehiculo.condicion !== '0km' || vehiculo.modeloAnio == null) return ''
  if (vehiculo.uso !== 'particular') return ''

  return `PRIVADO, modelo año:${vehiculo.modeloAnio}, dominio a consignar.`
}

function capitalizar(estadoCivil?: string): string {
  const valor = (estadoCivil ?? '').trim()
  if (!valor) return ''
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase()
}
