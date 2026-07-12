import type { CampoPDF, PersonaParaImprimir, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial del contrato FCA plan de ahorro (Legal, 612×1008pt).
export const CONTRATO_PAG2_TAMANO_PAGINA: [number, number] = [612, 1008]
export const CONTRATO_PAG2_CANTIDAD_PAGINAS = 1

// contrato_pag2_datos_reales.pdf vino vacío (870 bytes, sin texto) en la
// muestra disponible: el trámite de referencia no tenía deudores solidarios.
// El PDF de campos sí muestra 4 bloques (DS1-DS4, uno por deudor solidario) —
// las coordenadas de cada campo están confirmadas contra ese PDF (posición),
// pero el FORMATO de cada valor (mayúsculas, separadores, etc.) no tiene
// evidencia real todavía: se aplica el mismo criterio ya confirmado en el
// resto de este contrato (nombreCompleto en mayúsculas, "D.N.I.: NNNN", una
// sola línea por domicilio) hasta poder calibrar contra un trámite real con
// deudor solidario.
//
// Fuente de datos: data.deudoresSolidarios[0..3] (wizard: paso "Deudores
// solidarios", hasta 4 — ver CONTEXT.md "PrendaDeudor"). ApoderadoAcr,
// OtrasAnot y Obs siguen sin campo modelado.
export function buildContratoPag2Fields(data: PrendaParaImprimir): CampoPDF[] {
  const ds = data.deudoresSolidarios ?? []

  return [
    ...camposDeudorSolidario(ds[0], {
      apel: { x: 149.52, y: 870.72 },
      eCivil: { x: 126.72, y: 861.72 },
      profesion: { x: 201.72, y: 861.72 },
      nac: { x: 132.72, y: 852.12 },
      edad: { x: 201.72, y: 852.12 },
      domic1: { x: 121.92, y: 842.52 },
      domic2: { x: 87.72, y: 833.52 },
      nroDoc: { x: 133.92, y: 824.52 },
    }),
    ...camposDeudorSolidario(ds[2], {
      apel: { x: 349.92, y: 870.72 },
      eCivil: { x: 329.52, y: 861.72 },
      profesion: { x: 403.92, y: 861.72 },
      nac: { x: 333.12, y: 852.12 },
      edad: { x: 403.92, y: 852.12 },
      domic1: { x: 322.32, y: 842.52 },
      domic2: { x: 288.12, y: 833.52 },
      nroDoc: { x: 334.32, y: 824.52 },
    }),
    ...camposDeudorSolidario(ds[1], {
      apel: { x: 149.52, y: 801.72 },
      eCivil: { x: 129.72, y: 792.72 },
      profesion: { x: 201.72, y: 792.72 },
      nac: { x: 132.72, y: 783.72 },
      edad: { x: 201.72, y: 783.72 },
      domic1: { x: 121.92, y: 775.32 },
      domic2: { x: 87.72, y: 765.72 },
      nroDoc: { x: 134.52, y: 756.72 },
    }),
    ...camposDeudorSolidario(ds[3], {
      apel: { x: 349.92, y: 801.72 },
      eCivil: { x: 329.52, y: 792.72 },
      profesion: { x: 403.92, y: 792.72 },
      nac: { x: 333.12, y: 783.72 },
      edad: { x: 403.92, y: 783.72 },
      domic1: { x: 322.32, y: 775.32 },
      domic2: { x: 288.12, y: 765.72 },
      nroDoc: { x: 334.32, y: 756.72 },
    }),

    // Sin campo modelado todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 213.12, y: 743.52, size: 9, pagina: 1 }, // Obs
    // { texto: '', x: 172.92, y: 498.72, size: 9, pagina: 1 }, // ApoderadoAcr
    // { texto: '', x: 178.32, y: 374.16, size: 9, pagina: 1 }, // OtrasAnot
  ]
}

interface CoordenadasDS {
  apel: { x: number; y: number }
  eCivil: { x: number; y: number }
  profesion: { x: number; y: number }
  nac: { x: number; y: number }
  edad: { x: number; y: number }
  domic1: { x: number; y: number }
  domic2: { x: number; y: number }
  nroDoc: { x: number; y: number }
}

function camposDeudorSolidario(deudor: PersonaParaImprimir | undefined, coords: CoordenadasDS): CampoPDF[] {
  return [
    { texto: deudor?.nombreCompleto ?? '', ...coords.apel, size: 9, pagina: 1 },
    { texto: capitalizar(deudor?.estadoCivil), ...coords.eCivil, size: 9, pagina: 1 },
    { texto: deudor?.profesion ?? '', ...coords.profesion, size: 9, pagina: 1 },
    { texto: deudor?.nacionalidad ?? '', ...coords.nac, size: 9, pagina: 1 },
    { texto: deudor?.edad ?? '', ...coords.edad, size: 9, pagina: 1 },
    { texto: formatearDomicilioLinea1(deudor), ...coords.domic1, size: 9, pagina: 1 },
    { texto: formatearDomicilioLinea2(deudor), ...coords.domic2, size: 9, pagina: 1 },
    { texto: formatearDocumento(deudor), ...coords.nroDoc, size: 9, pagina: 1 },
  ]
}

function capitalizar(estadoCivil?: string): string {
  const valor = (estadoCivil ?? '').trim()
  if (!valor) return ''
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase()
}

const ETIQUETA_DOCUMENTO: Record<string, string> = {
  DNI: 'D.N.I.',
  LE: 'L.E.',
  LC: 'L.C.',
  PASAPORTE: 'Pasaporte',
}

function formatearDocumento(persona: PersonaParaImprimir | undefined): string {
  if (!persona?.dni) return ''
  const etiqueta = ETIQUETA_DOCUMENTO[persona.tipoDocumento ?? 'DNI'] ?? 'D.N.I.'
  return `${etiqueta}: ${persona.dni}`
}

// Línea 1 del domicilio: calle, número, piso/depto.
function formatearDomicilioLinea1(persona: PersonaParaImprimir | undefined): string {
  if (!persona?.calle) return ''
  const numero = persona.numero ? ` ${persona.numero}` : ''
  const piso = persona.piso ? ` Piso ${persona.piso}` : ''
  const depto = persona.depto ? ` Depto ${persona.depto}` : ''
  return `${persona.calle}${numero}${piso}${depto}`
}

// Línea 2 del domicilio: localidad, código postal.
function formatearDomicilioLinea2(persona: PersonaParaImprimir | undefined): string {
  if (!persona?.localidad) return ''
  const cp = persona.cp ? ` (${persona.cp})` : ''
  return `${persona.localidad}${cp}`
}
