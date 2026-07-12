import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial del contrato FCA Compañía Financiera (Legal, 612×1008pt).
export const CONTRATO_FCA_CIA_FINANCIERA_PAG2_TAMANO_PAGINA: [number, number] = [612, 1008]
export const CONTRATO_FCA_CIA_FINANCIERA_PAG2_CANTIDAD_PAGINAS = 1

// contrato_pagina2_datos_reales.pdf vino prácticamente vacío (871 bytes, sin
// texto) en la muestra disponible: el trámite de referencia no tenía
// codeudor ni traslado. El PDF de campos sí muestra un bloque de codeudor
// (apellido, estado civil, profesión, nacionalidad, fecha de nacimiento,
// domicilio en 2 líneas y N° de documento) + un bloque de traslado
// (ubicación y fecha), pero ninguno tiene evidencia real todavía — queda
// comentado hasta calibrar contra un trámite con codeudor o traslado.
//
// A diferencia del contrato FCA Plan de Ahorro (que modela hasta 4 deudores
// solidarios — ApelDS1..4), esta página de Compañía Financiera modela un
// único codeudor (Codeudor, sin numerar) más una sección de traslado del
// vehículo que el plan de ahorro no tiene.
//
// La decisión de si esta página corresponde o no es una regla de negocio
// (según CLAUDE.md: "asentimiento conyugal, hoja continuación... viven en
// services/, nunca en templates/") — este archivo solo sabe posicionar
// texto; quien lo llama decide si hay codeudor o traslado y si corresponde
// generarla.
export function buildContratoFcaCiaFinancieraPag2Fields(_data: PrendaParaImprimir): CampoPDF[] {
  return [
    // Sin evidencia real todavía (posiciones conocidas por el PDF de campos):
    // { texto: '', x: 96.12,  y: 965.04, size: 9, pagina: 1 }, // ApelCodeudor1
    // { texto: '', x: 114.12, y: 947.04, size: 9, pagina: 1 }, // ECivilCodeudor
    // { texto: '', x: 258.72, y: 947.04, size: 9, pagina: 1 }, // ProfesionCodeudor
    // { texto: '', x: 266.52, y: 938.64, size: 9, pagina: 1 }, // NacCodeudor
    // { texto: '', x: 77.52,  y: 937.44, size: 9, pagina: 1 }, // FechaNacCodeudor
    // { texto: '', x: 180.72, y: 929.04, size: 9, pagina: 1 }, // NroDocCodeudor
    // { texto: '', x: 329.52, y: 927.96, size: 9, pagina: 1 }, // Domic1Codeudor
    // { texto: '', x: 70.32,  y: 919.56, size: 9, pagina: 1 }, // Domic2Codeudor
    // { texto: '', x: 70.32,  y: 880.8,  size: 9, pagina: 1 }, // Obs
    //
    // { texto: '', x: 116.52, y: 521.64, size: 9, pagina: 1 }, // Traslado (ubicación)
    // { texto: '', x: 299.52, y: 521.64, size: 9, pagina: 1 }, // TrasladoMes
    // { texto: '', x: 384.72, y: 520.44, size: 9, pagina: 1 }, // TrasladoAno
    // { texto: '', x: 396.12, y: 508.56, size: 9, pagina: 1 }, // TrasladoUbic
    // { texto: '', x: 70.32,  y: 498.96, size: 9, pagina: 1 }, // TrasladoUbicacion2
  ]
}
