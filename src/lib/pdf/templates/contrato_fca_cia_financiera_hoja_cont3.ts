import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial de la hoja de continuación 3 de Compañía
// Financiera (Legal, 612×1008pt).
export const HOJA_CONT_CIA_FINANCIERA_3_TAMANO_PAGINA: [number, number] = [612, 1008]
export const HOJA_CONT_CIA_FINANCIERA_3_CANTIDAD_PAGINAS = 1

// IMPORTANTE: esta hoja de continuación NO es la misma que
// contrato_hoja_cont3.ts (calibrada para FCA Plan de Ahorro, asentimiento
// conyugal). Son formularios físicos distintos — nombres de campo y
// coordenadas no coinciden en nada (se comparó explícitamente antes de
// calibrar esta). No reutilizar coordenadas entre financieras para esta
// sección.
//
// Coordenadas calibradas cruzando
// scripts/referencias/contrato_cia_financiera/hojas_continuacion_pagina3_campos.pdf
// contra hojas_continuacion_pagina3_datos_reales.pdf.
//
// Esta hoja tiene EXACTAMENTE las mismas coordenadas que
// contrato_fca_cia_financiera_hoja_cont4.ts (hoja_continuacion4_campos.pdf
// coincide campo por campo con esta) — es una hoja "extra" genérica que
// Autoforms repite tantas veces como haga falta (garantes/codeudores
// adicionales), no una página con contenido fijo distinto.
//
// "NroOrden" no tuvo evidencia en esta muestra (solo trae "Deudor"), pero sí
// en la muestra de hoja_continuacion4 (misma coordenada, mismo campo) donde
// imprimió una patente ("MDR988") — se toma esa evidencia cruzada como válida
// por ser la misma hoja física repetida.
export function buildHojaContCiaFinanciera3Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { deudores, vehiculo } = data
  const solicitante = deudores[0]

  return [
    { texto: solicitante?.nombreCompleto ?? '', x: 94.32, y: 812.88, size: 9, pagina: 1 },
    { texto: vehiculo.patente ?? '', x: 342.72, y: 775.32, size: 9, pagina: 1 },

    // Sin evidencia real todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 76.32, y: 755.28, size: 9, pagina: 1 }, // Cont — párrafo de continuación, sin evidencia en ninguna de las 2 muestras disponibles; probablemente sujeto al mismo problema de wrap que "Cont" en contrato_hoja_cont3.ts
    //
    // Lote1/Lote2 (x=412.32, y=973.32/961.32): sin evidencia real, mismo
    // patrón de campos de control interno visto en el resto del contrato.
  ]
}
