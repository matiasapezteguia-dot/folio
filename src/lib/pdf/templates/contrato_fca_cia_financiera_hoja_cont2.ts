import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial de la hoja de continuación 2 de Compañía
// Financiera (Legal, 612×1008pt).
export const HOJA_CONT_CIA_FINANCIERA_2_TAMANO_PAGINA: [number, number] = [612, 1008]
export const HOJA_CONT_CIA_FINANCIERA_2_CANTIDAD_PAGINAS = 1

// IMPORTANTE: esta hoja de continuación NO es la misma que
// contrato_hoja_cont2.ts (calibrada para FCA Plan de Ahorro). Son formularios
// físicos distintos — nombres de campo y coordenadas no coinciden en nada
// (se comparó explícitamente antes de calibrar esta). No reutilizar
// coordenadas entre financieras para esta sección.
//
// Coordenadas calibradas cruzando
// scripts/referencias/contrato_cia_financiera/hojas_continuacion_pagina2_campos.pdf
// contra hojas_continuacion_pagina2_datos_reales.pdf — cada (x,y) coincide
// exactamente entre ambos.
//
// PersonaParaImprimir modela un solo domicilio (no distingue domicilio real
// de domicilio legal/constituido) — igual que en contrato_hoja_cont2.ts, se
// reutiliza el único domicilio disponible del solicitante para estos campos.
export function buildHojaContCiaFinanciera2Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { deudores } = data
  const solicitante = deudores[0]

  return [
    { texto: formatearCalleNumero(solicitante), x: 211.92, y: 503.52, size: 9, pagina: 1 },
    { texto: solicitante?.localidad ?? '', x: 126.72, y: 496.32, size: 9, pagina: 1 },
    { texto: solicitante?.provincia ?? '', x: 319.92, y: 496.32, size: 9, pagina: 1 },

    // Sin evidencia real todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 175.32, y: 541.68, size: 9, pagina: 1 }, // Calle1
    // { texto: '', x: 162.12, y: 521.88, size: 9, pagina: 1 }, // Calle2
  ]
}

function formatearCalleNumero(persona: PrendaParaImprimir['deudores'][number] | undefined): string {
  if (!persona?.calle) return ''
  return persona.numero ? `${persona.calle} ${persona.numero}` : persona.calle
}
