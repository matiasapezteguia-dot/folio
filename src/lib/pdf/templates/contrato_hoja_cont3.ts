import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'
import { formatearFechaLarga } from './fechaLarga'

// Tamaño de página oficial de la hoja de continuación 3 (Legal, 612×1008pt).
export const HOJA_CONT3_TAMANO_PAGINA: [number, number] = [612, 1008]
export const HOJA_CONT3_CANTIDAD_PAGINAS = 1

// Coordenadas calibradas cruzando scripts/referencias/contrato/hoja_cont3_campos.pdf
// contra hoja_cont3_datos_reales.pdf.
//
// Esta hoja es el asentimiento conyugal — su inclusión es la regla de negocio
// que CLAUDE.md nombra explícitamente ("asentimiento conyugal... vive en
// services/, nunca en templates/"): este archivo solo posiciona texto, quien
// lo llama decide si corresponde generarla (deudor casado sin separación de
// bienes, etc).
//
// El párrafo principal ("Cont") no está calibrado: en la muestra real ocupa
// 5 líneas envueltas manualmente por el generador de Autoforms según el largo
// exacto del nombre/DNI del cónyuge, algo que engine.ts no soporta hoy (dibuja
// texto plano por coordenada, sin wrap de párrafos). Además el texto
// interpola nombre+DNI del cónyuge como bloque ("APELLIDO, NOMBRE, D.N.I.
// 12345678"), y PersonaParaImprimir.conyuge hoy es un string plano (sin DNI
// separado). Falta esa pieza de modelado y una función de wrap en el engine
// antes de calibrar este campo — se deja pendiente en vez de aproximar.
export function buildHojaCont3Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { contrato, deudores } = data
  const solicitante = deudores[0]
  const { dia, mesTexto, anio } = formatearFechaLarga(contrato.fecha)

  return [
    { texto: contrato.grupo ?? '', x: 247.32, y: 930.48, size: 9, pagina: 1 },
    { texto: contrato.orden ?? '', x: 380.52, y: 930.48, size: 9, pagina: 1 },
    { texto: dia && anio ? `${dia} de ${mesTexto} de ${anio}` : '', x: 231.12, y: 894.48, size: 9, pagina: 1 },
    { texto: solicitante?.nombreCompleto ?? '', x: 104.52, y: 871.68, size: 9, pagina: 1 },

    // Pendiente (ver comentario arriba): párrafo de asentimiento conyugal,
    // 5 líneas en la muestra real, x=49.32, y desde 733.68 bajando de a ~9pt:
    // { texto: '', x: 49.32, y: 733.68, size: 9, pagina: 1 },
    // { texto: '', x: 49.32, y: 724.68, size: 9, pagina: 1 },
    // { texto: '', x: 49.32, y: 715.68, size: 9, pagina: 1 },
    // { texto: '', x: 49.32, y: 706.68, size: 9, pagina: 1 },
    // { texto: '', x: 49.32, y: 697.68, size: 9, pagina: 1 },
  ]
}
