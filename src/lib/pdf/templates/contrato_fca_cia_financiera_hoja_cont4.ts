import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial de la hoja de continuación 4 de Compañía
// Financiera (Legal, 612×1008pt).
export const HOJA_CONT_CIA_FINANCIERA_4_TAMANO_PAGINA: [number, number] = [612, 1008]
export const HOJA_CONT_CIA_FINANCIERA_4_CANTIDAD_PAGINAS = 1

// IMPORTANTE: esta hoja de continuación NO es la misma que ninguna de
// contrato_hoja_cont1/2/3.ts (calibradas para FCA Plan de Ahorro). No
// reutilizar coordenadas entre financieras para esta sección.
//
// Coordenadas calibradas cruzando
// scripts/referencias/contrato_cia_financiera/hoja_continuacion4_campos.pdf
// contra hoja_continuacion4_datos_reales.pdf.
//
// Esta hoja tiene EXACTAMENTE las mismas coordenadas que
// contrato_fca_cia_financiera_hoja_cont3.ts — ver el comentario en ese
// archivo. Es la misma hoja "extra" genérica repetida (Autoforms la agrega
// tantas veces como haga falta), no una página con contenido propio. Se
// mantiene como archivo separado para reflejar 1:1 los PDFs de referencia
// entregados (hoja_continuacion4_*.pdf), pero ambos templates son
// intercambiables en la práctica.
//
// La muestra de esta hoja usó un trámite de prueba distinto (deudor
// "MATIAS, APEZTEGUIA", patente "MDR988"), lo que permitió confirmar
// "NroOrden" = patente/dominio del vehículo (sin evidencia en la muestra de
// hoja_continuacion_pagina3).
export function buildHojaContCiaFinanciera4Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { deudores, vehiculo } = data
  const solicitante = deudores[0]

  return [
    { texto: solicitante?.nombreCompleto ?? '', x: 94.32, y: 812.88, size: 9, pagina: 1 },
    { texto: vehiculo.patente ?? '', x: 342.72, y: 775.32, size: 9, pagina: 1 },

    // Sin evidencia real todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 76.32, y: 755.28, size: 9, pagina: 1 }, // Cont — párrafo de continuación, sin evidencia en la muestra
    //
    // Lote1/Lote2 (x=412.32, y=973.32/961.32): sin evidencia real, mismo
    // patrón de campos de control interno visto en el resto del contrato.
  ]
}
