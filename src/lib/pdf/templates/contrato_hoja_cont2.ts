import type { CampoPDF, DomicilioConstituido, PersonaParaImprimir, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial de la hoja de continuación 2 (Legal, 612×1008pt).
export const HOJA_CONT2_TAMANO_PAGINA: [number, number] = [612, 1008]
export const HOJA_CONT2_CANTIDAD_PAGINAS = 1

// Coordenadas calibradas cruzando scripts/referencias/contrato/hoja_cont2_campos.pdf
// contra hoja_cont2_datos_reales.pdf — cada (x,y) coincide exactamente entre
// ambos, confirmando la identidad de cada campo.
//
// Garante, DNIGarante y DomicilioGarante (punto 15°): confirmado contra un
// trámite real sin garante cargado (scripts/referencias/EJEMPLO_PLAN_AHORRO_FIAT)
// que cuando no hay garante, el punto 15° igual se completa con los datos
// del propio deudor — nunca se deja en blanco. DNIGarante va sin "D.N.I.:"
// porque el formulario físico ya tiene impreso "DNI/LE/LC/CI Nº" antes del
// campo (a diferencia del DNI del deudor en contrato_fca_plan_ahorro_pag1.ts,
// que sí necesita la etiqueta porque ahí no hay texto preimpreso). Sigue sin
// evidencia real el caso de un garante VERDADERO cargado (formato de nombre/
// domicilio cuando no es el fallback al deudor) — mismo criterio ya usado en
// el resto del contrato hasta poder calibrarlo.
//
// CalleDeudor/CalleGarante/CalleGaranteAcr (punto 16°, "Domicilio constituido
// en la Ciudad de Buenos Aires"): confirmado contra el mismo trámite que los
// 3 bloques se completan con domicilioConstituido (dato fijo de la
// financiera, no del deudor — ver DomicilioConstituido en types/pdf.ts) en
// vez de quedar en blanco. Sin evidencia todavía de qué reemplaza a cada uno
// cuando SÍ hay garante real o un domicilio de acreedor distinto cargado —
// por ahora los 3 bloques siempre usan el mismo valor.
export function buildHojaCont2Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { contrato, deudores, garante, domicilioConstituido } = data
  const solicitante = deudores[0]

  return [
    { texto: contrato.grupo ?? '', x: 172.8, y: 554.76, size: 9, pagina: 1 },
    { texto: contrato.orden ?? '', x: 211.8, y: 554.76, size: 9, pagina: 1 },

    // Domicilio real del deudor
    { texto: solicitante?.calle ?? '', x: 131.4, y: 451.56, size: 9, pagina: 1 },
    { texto: solicitante?.numero ?? '', x: 373.2, y: 449.16, size: 9, pagina: 1 },
    { texto: solicitante?.localidad ?? '', x: 133.8, y: 443.16, size: 9, pagina: 1 },
    { texto: solicitante?.provincia ?? '', x: 346.2, y: 440.76, size: 9, pagina: 1 },

    // Garante (punto 15°). Sin garante real cargado, se completa con los
    // datos del propio deudor (comportamiento confirmado, ver comentario arriba).
    { texto: garante?.nombre ?? solicitante?.nombreCompleto ?? '', x: 87.6, y: 642.36, size: 9, pagina: 1 }, // Garante
    { texto: garante?.dni ?? solicitante?.dni ?? '', x: 240.6, y: 635.16, size: 9, pagina: 1 }, // DNIGarante
    {
      texto: garante?.domicilio ?? formatearDomicilioDeudorLineaUnica(solicitante) ?? '',
      x: 385.8,
      y: 635.16,
      size: 9,
      pagina: 1,
    }, // DomicilioGarante

    // Domicilio constituido en la Ciudad de Buenos Aires (punto 16°) — 3
    // bloques (deudor / garante / garante-acreedor, nombres de Autoforms).
    // Sin garante real ni domicilio de acreedor distinto cargado, los 3 usan
    // domicilioConstituido (ver comentario arriba).
    ...camposDomicilioConstituido(domicilioConstituido, {
      calle: { x: 126.6, y: 539.16 },
      numero: { x: 118.8, y: 530.16 },
      piso: { x: 178.8, y: 527.76 },
      depto: { x: 234, y: 530.16 },
    }), // CalleDeudor/NroDeudor/PisoDeudor/DeptoDeudor
    ...camposDomicilioConstituido(domicilioConstituido, {
      calle: { x: 126.6, y: 495.36 },
      numero: { x: 118.8, y: 486.96 },
      piso: { x: 179.4, y: 489.36 },
      depto: { x: 227.4, y: 482.16 },
    }), // CalleGarante/NroGarante/PisoGarante/DeptoGarante
    ...camposDomicilioConstituido(domicilioConstituido, {
      calle: { x: 307.2, y: 497.76 },
      numero: { x: 297.62, y: 486.96 },
      piso: { x: 360, y: 486.96 },
      depto: { x: 415.2, y: 489.36 },
    }), // CalleGaranteAcr/NroGaranteAcr/PisoGaranteAcr/DeptoGaranteAcr

    // Sin evidencia real todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 63,     y: 635.16, size: 9, pagina: 1 }, // Garante1Cont
    // { texto: '', x: 63,     y: 627.96, size: 9, pagina: 1 }, // Domicilio2Garante
    // { texto: '', x: 63,     y: 620.76, size: 9, pagina: 1 }, // Domicilio3Garante
    // { texto: '', x: 305.4,  y: 620.76, size: 9, pagina: 1 }, // Garante2 (imprimió ";" suelto en la muestra, sin nombre real)
    // { texto: '', x: 89.4,   y: 612.96, size: 9, pagina: 1 }, // DomicilioGarante2
    // { texto: '', x: 288.6,  y: 391.56, size: 9, pagina: 1 }, // Obs1
    // { texto: '', x: 63.6,   y: 384.96, size: 9, pagina: 1 }, // Obs18
    // { texto: '', x: 237,    y: 361.8,  size: 9, pagina: 1 }, // Obs
  ]
}

// Línea única (sin desglosar) para el campo "domiciliado en" del punto 15°
// cuando no hay garante real: calle + número + localidad, sin provincia
// (confirmado contra el trámite real: "RENDON 3226 OLAVARRIA").
function formatearDomicilioDeudorLineaUnica(solicitante: PersonaParaImprimir | undefined): string {
  if (!solicitante?.calle) return ''
  const numero = solicitante.numero ? ` ${solicitante.numero}` : ''
  const localidad = solicitante.localidad ? ` ${solicitante.localidad}` : ''
  return `${solicitante.calle}${numero}${localidad}`
}

interface CoordenadasDomicilioConstituido {
  calle: { x: number; y: number }
  numero: { x: number; y: number }
  piso: { x: number; y: number }
  depto: { x: number; y: number }
}

function camposDomicilioConstituido(
  domicilio: DomicilioConstituido | undefined,
  coords: CoordenadasDomicilioConstituido
): CampoPDF[] {
  return [
    { texto: domicilio?.calle ?? '', ...coords.calle, size: 9, pagina: 1 },
    { texto: domicilio?.numero ?? '', ...coords.numero, size: 9, pagina: 1 },
    { texto: domicilio?.piso ?? '', ...coords.piso, size: 9, pagina: 1 },
    { texto: domicilio?.depto ?? '', ...coords.depto, size: 9, pagina: 1 },
  ]
}
