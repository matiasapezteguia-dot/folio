import type { CampoPDF, PersonaParaImprimir, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial del contrato FCA Compañía Financiera (Legal, 612×1008pt).
export const CONTRATO_FCA_CIA_FINANCIERA_PAG2_TAMANO_PAGINA: [number, number] = [612, 1008]
export const CONTRATO_FCA_CIA_FINANCIERA_PAG2_CANTIDAD_PAGINAS = 1

// contrato_pagina2_datos_reales.pdf vino prácticamente vacío (871 bytes, sin
// texto) en la muestra disponible: el trámite de referencia no tenía
// codeudor ni traslado. Las coordenadas del bloque de codeudor (apellido,
// estado civil, profesión, nacionalidad, fecha de nacimiento, domicilio en
// 2 líneas y N° de documento) están confirmadas contra el PDF de campos,
// pero no el FORMATO exacto de cada valor — se activan ahora que el wizard
// captura codeudor (data.deudoresSolidarios[0], único slot calibrado en
// este formulario) con el mismo criterio ya usado en el resto del contrato.
//
// A diferencia del contrato FCA Plan de Ahorro (que modela hasta 4 deudores
// solidarios — ApelDS1..4), esta página de Compañía Financiera modela un
// único codeudor (Codeudor, sin numerar) — si el wizard carga más de uno,
// solo el primero (índice 0) se imprime; es una limitación del formulario
// físico, no del sistema (ver Paso4DeudoresGarantes.tsx).
//
// El bloque de traslado (ubicación/fecha) y Obs siguen sin campo modelado.
export function buildContratoFcaCiaFinancieraPag2Fields(data: PrendaParaImprimir): CampoPDF[] {
  const codeudor = data.deudoresSolidarios?.[0]

  return [
    { texto: codeudor?.nombreCompleto ?? '', x: 96.12, y: 965.04, size: 9, pagina: 1 }, // ApelCodeudor1
    { texto: capitalizar(codeudor?.estadoCivil), x: 114.12, y: 947.04, size: 9, pagina: 1 }, // ECivilCodeudor
    { texto: codeudor?.profesion ?? '', x: 258.72, y: 947.04, size: 9, pagina: 1 }, // ProfesionCodeudor
    { texto: codeudor?.nacionalidad ?? '', x: 266.52, y: 938.64, size: 9, pagina: 1 }, // NacCodeudor
    { texto: formatearFecha(codeudor?.fechaNacimiento), x: 77.52, y: 937.44, size: 9, pagina: 1 }, // FechaNacCodeudor
    { texto: formatearDocumento(codeudor), x: 180.72, y: 929.04, size: 9, pagina: 1 }, // NroDocCodeudor
    { texto: formatearDomicilioLinea1(codeudor), x: 329.52, y: 927.96, size: 9, pagina: 1 }, // Domic1Codeudor
    { texto: formatearDomicilioLinea2(codeudor), x: 70.32, y: 919.56, size: 9, pagina: 1 }, // Domic2Codeudor

    // Sin campo modelado todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 70.32,  y: 880.8,  size: 9, pagina: 1 }, // Obs
    //
    // { texto: '', x: 116.52, y: 521.64, size: 9, pagina: 1 }, // Traslado (ubicación)
    // { texto: '', x: 299.52, y: 521.64, size: 9, pagina: 1 }, // TrasladoMes
    // { texto: '', x: 384.72, y: 520.44, size: 9, pagina: 1 }, // TrasladoAno
    // { texto: '', x: 396.12, y: 508.56, size: 9, pagina: 1 }, // TrasladoUbic
    // { texto: '', x: 70.32,  y: 498.96, size: 9, pagina: 1 }, // TrasladoUbicacion2
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

// El wizard captura la fecha de nacimiento real (no edad) en formato ISO
// (input type="date") — se imprime como DD/MM/AAAA.
function formatearFecha(fecha?: string): string {
  const iso = fecha?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!iso) return ''
  const [, anio, mes, dia] = iso
  return `${dia}/${mes}/${anio}`
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
