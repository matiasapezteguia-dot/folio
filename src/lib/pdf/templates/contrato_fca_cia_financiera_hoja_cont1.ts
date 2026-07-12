import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial de la hoja de continuación 1 de Compañía
// Financiera (Legal, 612×1008pt).
export const HOJA_CONT_CIA_FINANCIERA_1_TAMANO_PAGINA: [number, number] = [612, 1008]
export const HOJA_CONT_CIA_FINANCIERA_1_CANTIDAD_PAGINAS = 1

// IMPORTANTE: esta hoja de continuación NO es la misma que
// contrato_hoja_cont1.ts (calibrada para FCA Plan de Ahorro). Son formularios
// físicos distintos — nombres de campo y coordenadas no coinciden en nada
// (se comparó explícitamente antes de calibrar esta). No reutilizar
// coordenadas entre financieras para esta sección.
//
// Coordenadas calibradas cruzando
// scripts/referencias/contrato_cia_financiera/hojas_continuacion_pagina1_campos.pdf
// contra hojas_continuacion_pagina1_datos_reales.pdf — cada (x,y) coincide
// exactamente entre ambos, confirmando la identidad de cada campo.
//
// "Ano" mostró "202" (truncado a 3 dígitos por ancho de campo) en la
// muestra — se imprime el año completo, ya que el dato real es inequívoco
// (coincide con el resto del contrato) y el motor no trunca.
export function buildHojaContCiaFinanciera1Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { contrato, acreedor, deudores } = data
  const solicitante = deudores[0]
  const { dia, mesTexto, anio } = formatearFecha(contrato.fecha)

  return [
    { texto: dia, x: 207.12, y: 926.04, size: 9, pagina: 1 },
    { texto: mesTexto, x: 230.52, y: 926.04, size: 9, pagina: 1 },
    { texto: anio, x: 281.52, y: 925.44, size: 9, pagina: 1 },
    { texto: acreedor.nombreCompleto ?? '', x: 315.12, y: 924.84, size: 9, pagina: 1 },
    { texto: contrato.monto != null ? formatearMontoConRelleno(contrato.monto) : '', x: 87.12, y: 924.36, size: 9, pagina: 1 },
    { texto: formatearDomicilioAcreedor(acreedor), x: 123.12, y: 917.04, size: 9, pagina: 1 },
    { texto: solicitante?.nombreCompleto ?? '', x: 133.92, y: 908.64, size: 9, pagina: 1 },

    // Lote1/Lote2 (x=412.32, y=969.6/958.44): sin evidencia real en ninguna
    // muestra disponible — parecen campos de control interno de Autoforms,
    // no datos del trámite (mismo patrón visto en el resto del contrato).
  ]
}

// El mes aparece deletreado en español con mayúscula inicial ("Junio"), a
// diferencia de la página 1 del contrato (que usa día/mes numérico).
function formatearFecha(fecha?: string): { dia: string; mesTexto: string; anio: string } {
  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  if (!fecha) return { dia: '', mesTexto: '', anio: '' }

  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const [, anio, mes, dia] = iso
    return { dia: String(Number(dia)), mesTexto: MESES[Number(mes) - 1] ?? '', anio }
  }

  const conBarras = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (conBarras) {
    const [, dia, mes, anio] = conBarras
    return { dia: String(Number(dia)), mesTexto: MESES[Number(mes) - 1] ?? '', anio }
  }

  return { dia: '', mesTexto: '', anio: '' }
}

// Confirmado contra hojas_continuacion_pagina1_datos_reales.pdf: monto con
// separador de miles y 2 decimales, seguido del relleno legal ".---"
// (convención para evitar alteración del monto impreso).
function formatearMontoConRelleno(monto: number): string {
  return `${monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}.---`
}

// Domicilio fijo del acreedor (financiera): "{calle} {numero} P.:{piso} ({cp}),"
function formatearDomicilioAcreedor(acreedor: PrendaParaImprimir['acreedor']): string {
  if (!acreedor.calle) return ''
  const numero = acreedor.numero ? ` ${acreedor.numero}` : ''
  const piso = acreedor.piso ? ` P.:${acreedor.piso}` : ''
  const cp = acreedor.cp ? ` (${acreedor.cp})` : ''
  return `${acreedor.calle}${numero}${piso}${cp},`
}
