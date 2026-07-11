import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'
import { formatearFechaLarga } from './fechaLarga'

// Tamaño de página oficial de la hoja de continuación 1 (Legal, 612×1008pt).
export const HOJA_CONT1_TAMANO_PAGINA: [number, number] = [612, 1008]
export const HOJA_CONT1_CANTIDAD_PAGINAS = 1

// Coordenadas calibradas cruzando scripts/referencias/contrato/hoja_cont1_campos.pdf
// contra hoja_cont1_datos_reales.pdf — cada (x,y) coincide exactamente entre
// ambos, confirmando la identidad de cada campo.
//
// "Bien" (tipo de bien prendado, ej. "AUTOMOTOR") es texto fijo del dominio
// de Folio, no un dato de la prenda — se deja como constante.
// "Deudor2" y "SerieNro" tienen posición conocida pero sin evidencia real de
// formato (SerieNro apareció como "-----", un placeholder de "sin dato").
export function buildHojaCont1Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { contrato, deudores, vehiculo } = data
  const solicitante = deudores[0]
  const { dia, mesTexto, anio } = formatearFechaLarga(contrato.fecha)

  return [
    { texto: dia && anio ? `${dia} de ${mesTexto} de ${anio}` : '', x: 206.16, y: 981.6, size: 9, pagina: 1 },
    { texto: solicitante?.nombreCompleto ?? '', x: 74.76, y: 952.2, size: 9, pagina: 1 },
    { texto: 'AUTOMOTOR', x: 228.36, y: 939, size: 9, pagina: 1 },
    { texto: vehiculo.marca ?? '', x: 297.36, y: 937.2, size: 9, pagina: 1 },
    { texto: vehiculo.modelo ?? '', x: 391, y: 937.2, size: 9, pagina: 1 },
    { texto: vehiculo.modeloAnio != null ? String(vehiculo.modeloAnio) : '', x: 58.56, y: 923.4, size: 9, pagina: 1 },
    { texto: vehiculo.numeroMotor ?? '', x: 163.56, y: 923.4, size: 9, pagina: 1 },
    { texto: vehiculo.numeroChasis ?? '', x: 284.2, y: 923.4, size: 9, pagina: 1 },

    // Sin evidencia real todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 42.36, y: 939, size: 9, pagina: 1 },   // Deudor2 — ¿segundo titular?
    // { texto: '', x: 408.36, y: 924.6, size: 9, pagina: 1 }, // SerieNro — en la muestra imprimió "-----" (placeholder de "sin dato")
    // { texto: '', x: 189.96, y: 402.48, size: 9, pagina: 1 }, // Obs
  ]
}
