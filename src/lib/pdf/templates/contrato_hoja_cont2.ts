import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial de la hoja de continuación 2 (Legal, 612×1008pt).
export const HOJA_CONT2_TAMANO_PAGINA: [number, number] = [612, 1008]
export const HOJA_CONT2_CANTIDAD_PAGINAS = 1

// Coordenadas calibradas cruzando scripts/referencias/contrato/hoja_cont2_campos.pdf
// contra hoja_cont2_datos_reales.pdf — cada (x,y) coincide exactamente entre
// ambos, confirmando la identidad de cada campo.
//
// Garante, DNIGarante y DomicilioGarante: la muestra disponible no tenía
// garante cargado, así que no hay evidencia real del FORMATO exacto — pero
// la posición de cada campo sí está confirmada (viene del PDF de campos), y
// ahora que el wizard captura datos de garante (data.garante) se activan
// con el criterio de formato ya usado en el resto del contrato (nombre tal
// cual, "D.N.I.: NNNN", domicilio como texto libre en un solo campo). El
// resto de los campos "Garante*"/"*Garante*" (Garante1Cont, Garante2,
// Domicilio2Garante, etc. — para un eventual 2º garante o domicilio legal
// distinto) siguen sin campo modelado en el wizard, quedan comentados.
export function buildHojaCont2Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { contrato, deudores, garante } = data
  const solicitante = deudores[0]

  return [
    { texto: contrato.grupo ?? '', x: 172.8, y: 554.76, size: 9, pagina: 1 },
    { texto: contrato.orden ?? '', x: 211.8, y: 554.76, size: 9, pagina: 1 },

    // Domicilio real del deudor
    { texto: solicitante?.calle ?? '', x: 131.4, y: 451.56, size: 9, pagina: 1 },
    { texto: solicitante?.numero ?? '', x: 373.2, y: 449.16, size: 9, pagina: 1 },
    { texto: solicitante?.localidad ?? '', x: 133.8, y: 443.16, size: 9, pagina: 1 },
    { texto: solicitante?.provincia ?? '', x: 346.2, y: 440.76, size: 9, pagina: 1 },

    // Garante (opcional — wizard: paso "Deudores solidarios/Garantes")
    { texto: garante?.nombre ?? '', x: 87.6, y: 642.36, size: 9, pagina: 1 }, // Garante
    { texto: garante?.dni ? `D.N.I.: ${garante.dni}` : '', x: 240.6, y: 635.16, size: 9, pagina: 1 }, // DNIGarante
    { texto: garante?.domicilio ?? '', x: 385.8, y: 635.16, size: 9, pagina: 1 }, // DomicilioGarante

    // Sin evidencia real todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 63,     y: 635.16, size: 9, pagina: 1 }, // Garante1Cont
    // { texto: '', x: 63,     y: 627.96, size: 9, pagina: 1 }, // Domicilio2Garante
    // { texto: '', x: 63,     y: 620.76, size: 9, pagina: 1 }, // Domicilio3Garante
    // { texto: '', x: 305.4,  y: 620.76, size: 9, pagina: 1 }, // Garante2 (imprimió ";" suelto en la muestra, sin nombre real)
    // { texto: '', x: 89.4,   y: 612.96, size: 9, pagina: 1 }, // DomicilioGarante2
    // { texto: '', x: 126.6,  y: 539.16, size: 9, pagina: 1 }, // CalleDeudor (domicilio legal, distinto del real de arriba)
    // { texto: '', x: 118.8,  y: 530.16, size: 9, pagina: 1 }, // NroDeudor
    // { texto: '', x: 234,    y: 530.16, size: 9, pagina: 1 }, // DeptoDeudor
    // { texto: '', x: 178.8,  y: 527.76, size: 9, pagina: 1 }, // PisoDeudor
    // { texto: '', x: 307.2,  y: 497.76, size: 9, pagina: 1 }, // CalleGaranteAcr
    // { texto: '', x: 126.6,  y: 495.36, size: 9, pagina: 1 }, // CalleGarante
    // { texto: '', x: 179.4,  y: 489.36, size: 9, pagina: 1 }, // PisoGarante
    // { texto: '', x: 415.2,  y: 489.36, size: 9, pagina: 1 }, // DeptoGaranteAcr
    // { texto: '', x: 118.8,  y: 486.96, size: 9, pagina: 1 }, // NroGarante
    // { texto: '', x: 297.62, y: 486.96, size: 9, pagina: 1 }, // NroGaranteAcr
    // { texto: '', x: 360,    y: 486.96, size: 9, pagina: 1 }, // PisoGaranteAcr
    // { texto: '', x: 227.4,  y: 482.16, size: 9, pagina: 1 }, // DeptoGarante
    // { texto: '', x: 288.6,  y: 391.56, size: 9, pagina: 1 }, // Obs1
    // { texto: '', x: 63.6,   y: 384.96, size: 9, pagina: 1 }, // Obs18
    // { texto: '', x: 237,    y: 361.8,  size: 9, pagina: 1 }, // Obs
  ]
}
