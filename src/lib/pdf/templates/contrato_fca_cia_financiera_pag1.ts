import type { CampoPDF, PersonaParaImprimir, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial del contrato FCA Compañía Financiera (Legal, 612×1008pt).
export const CONTRATO_FCA_CIA_FINANCIERA_PAG1_TAMANO_PAGINA: [number, number] = [612, 1008]
export const CONTRATO_FCA_CIA_FINANCIERA_PAG1_CANTIDAD_PAGINAS = 1

// Coordenadas calibradas cruzando
// scripts/referencias/contrato_cia_financiera/contrato_pagina1_campos.pdf
// (overlay con el NOMBRE de cada campo) contra contrato_pagina1_datos_reales.pdf
// (mismo overlay con datos reales) — cada (x,y) coincide exactamente entre
// ambos, confirmando la identidad de cada campo.
//
// A diferencia del contrato FCA Plan de Ahorro (donde la leyenda de
// cuotas/intereses viene preimpresa en el papel), acá Autoforms sí imprime
// monto, monto en letras y la leyenda de cuotas — confirma lo que dice
// CONTEXT.md sobre `template_acreedor.texto_documentacion`.
//
// Campos sin evidencia confiable en la única muestra disponible quedan
// comentados al final: la muestra trunca varios campos de texto largo al
// ancho de su caja (ej. "BUENOS" en vez de "BUENOS AIRES", "15,244,225."
// sin los centavos) — no se adivina el contenido completo.
export function buildContratoFcaCiaFinancieraPag1Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { contrato, acreedor, deudores, vehiculo } = data
  const solicitante = deudores[0]
  const { diaMes, anio } = formatearFechaCorta(contrato.fecha)

  return [
    // Lugar y fecha de celebración — a diferencia del plan de ahorro (que
    // deletrea el mes), acá el PDF real usa día/mes numérico ("29/06") y el
    // año en un campo aparte ("AnoP").
    { texto: contrato.lugar && diaMes ? `${contrato.lugar}, ${diaMes}` : '', x: 357.6, y: 917.64, size: 9, pagina: 1 },
    { texto: anio, x: 454.8, y: 917.64, size: 9, pagina: 1 },

    // Deudor (se repite dos veces en la página: encabezado y sección de datos personales)
    { texto: solicitante?.nombreCompleto ?? '', x: 106.2, y: 854.04, size: 9, pagina: 1 },
    { texto: solicitante?.nombreCompleto ?? '', x: 330, y: 528.84, size: 9, pagina: 1 },

    // Vehículo
    { texto: vehiculo.marca ?? '', x: 127.8, y: 802.44, size: 9, pagina: 1 },
    { texto: vehiculo.tipo ?? '', x: 342.6, y: 801.24, size: 9, pagina: 1 },
    { texto: vehiculo.modelo ?? '', x: 92.4, y: 793.68, size: 9, pagina: 1 },
    { texto: vehiculo.marcaMotor ?? '', x: 112.8, y: 785.04, size: 9, pagina: 1 },
    { texto: vehiculo.numeroMotor ?? '', x: 337.8, y: 783.24, size: 9, pagina: 1 },
    { texto: vehiculo.marcaChasis ?? '', x: 172.8, y: 775.44, size: 9, pagina: 1 },
    { texto: vehiculo.numeroChasis ?? '', x: 337.8, y: 774.24, size: 9, pagina: 1 },
    { texto: formatearUnidad(vehiculo), x: 89.4, y: 766.44, size: 9, pagina: 1 },
    { texto: formatearUso(vehiculo), x: 315.6, y: 765.24, size: 9, pagina: 1 },

    // Domicilio real del deudor (provincia/partido/localidad/calle)
    { texto: solicitante?.provincia ?? '', x: 206.4, y: 746.04, size: 9, pagina: 1 },
    { texto: solicitante?.partido ?? '', x: 87, y: 737.04, size: 9, pagina: 1 },
    { texto: solicitante?.localidad ?? '', x: 117, y: 719.04, size: 9, pagina: 1 },
    { texto: solicitante?.calle ?? '', x: 262.8, y: 719.04, size: 9, pagina: 1 },

    // Datos personales del deudor
    { texto: capitalizar(solicitante?.estadoCivil), x: 306, y: 510.24, size: 9, pagina: 1 },
    { texto: solicitante?.profesion ?? '', x: 392.4, y: 510.24, size: 9, pagina: 1 },
    { texto: solicitante?.edad ?? '', x: 431.4, y: 502.2, size: 9, pagina: 1 },
    { texto: solicitante?.nacionalidad ?? '', x: 310.2, y: 501.24, size: 9, pagina: 1 },
    { texto: formatearDomicilioCompleto(solicitante), x: 300.6, y: 492.48, size: 9, pagina: 1 },

    // Identificación
    { texto: acreedor.cuit ? `CUIT/CUIL: ${acreedor.cuit}` : '', x: 62.4, y: 477.24, size: 9, pagina: 1 },
    { texto: solicitante?.dni ? `D.N.I.: ${solicitante.dni}` : '', x: 346.2, y: 474.84, size: 9, pagina: 1 },
    { texto: solicitante?.cuit ? `CUIT/CUIL: ${solicitante.cuit}` : '', x: 264.6, y: 465.24, size: 9, pagina: 1 },

    // Sin evidencia confiable todavía (posición conocida por el PDF de campos):
    // { texto: '', x: 253.2, y: 915, size: 9, pagina: 1 }, // Pesos — la muestra trunca a "15,244,225." (sin centavos); MontoPrenda en hoja_continuacion_pagina1 sí muestra el monto completo con relleno legal ("15,244,225.44.---"), pero no hay evidencia de que este campo use el mismo ancho/formato
    // { texto: '', x: 64.8, y: 877.44, size: 9, pagina: 1 }, // PesosLetras — la muestra corta a mitad de palabra ("...CON CUARENTA Y") y no incluye "PESOS" ni usa el formato "NN/100" del conversor numeroALetras() existente
    // { texto: '', x: 64.8, y: 867.24, size: 9, pagina: 1 }, // PesosLetras2 — segunda línea, sin evidencia real
    // { texto: '', x: 61.8, y: 844.44, size: 9, pagina: 1 }, // Deudor2 — sin evidencia real
    // { texto: '', x: 274.2, y: 737.04, size: 9, pagina: 1 }, // Cuartel — sin evidencia real (igual que en plan de ahorro)
    // { texto: '', x: 214.8, y: 726.84, size: 9, pagina: 1 }, // NombreEst — sin evidencia real (igual que en plan de ahorro)
    // { texto: '', x: 62.4,  y: 678.84, size: 9, pagina: 1 }, // Docum — leyenda de cuotas/intereses envuelta en 6 líneas en la muestra; texto dinámico según template_acreedor, engine.ts no soporta wrap todavía (mismo problema que "Cont" en hoja_cont3)
    // { texto: '', x: 65.4,  y: 569.64, size: 9, pagina: 1 }, // SegPesos — sin datos de seguro en la muestra
    // { texto: '', x: 181.8, y: 569.64, size: 9, pagina: 1 }, // SeguroContra
    // { texto: '', x: 328.8, y: 569.64, size: 9, pagina: 1 }, // SeguroCompania
    // { texto: '', x: 137.4, y: 560.64, size: 9, pagina: 1 }, // SeguroCalle
    // { texto: '', x: 220.8, y: 560.04, size: 9, pagina: 1 }, // SeguroNro
    // { texto: '', x: 417.01,y: 560.04, size: 9, pagina: 1 }, // SeguroPolizaNro
    // { texto: '', x: 136.8, y: 552.24, size: 9, pagina: 1 }, // SegVenc (día)
    // { texto: '', x: 187.18,y: 552.24, size: 9, pagina: 1 }, // SegVencMes
    // { texto: '', x: 277.8, y: 552.24, size: 9, pagina: 1 }, // SegVencAn
    // { texto: '', x: 267,   y: 519.24, size: 9, pagina: 1 }, // ApyNombreDeudor2 — sin evidencia real
    // { texto: '', x: 392.4, y: 518.04, size: 9, pagina: 1 }, // ProfesionDEudor (variante sin "2") — sin evidencia real, igual que en plan de ahorro
    // { texto: '', x: 267,   y: 484.08, size: 9, pagina: 1 }, // DomicilioDeudor2 — segunda línea, sin evidencia real
    // { texto: '', x: 238.2, y: 593.64, size: 9, pagina: 1 }, // Interesdel — la muestra mostró "10.90" pero no hay campo modelado en ContratoParaImprimir para esta tasa (¿CFT nom. sin IVA?)
  ]
}

// Confirmado contra contrato_pagina1_datos_reales.pdf: día/mes numérico con
// cero a la izquierda ("29/06"), separado del año ("2026" en campo AnoP).
// Distinto del contrato FCA Plan de Ahorro, que deletrea el mes.
function formatearFechaCorta(fecha?: string): { diaMes: string; anio: string } {
  if (!fecha) return { diaMes: '', anio: '' }

  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const [, anio, mes, dia] = iso
    return { diaMes: `${dia}/${mes}`, anio }
  }

  const conBarras = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (conBarras) {
    const [, dia, mes, anio] = conBarras
    return { diaMes: `${dia}/${mes}`, anio }
  }

  return { diaMes: '', anio: '' }
}

// El sistema que generó la muestra real usa "0 KILÓMETRO" para 0km. No hay
// evidencia real para "usado".
function formatearUnidad(vehiculo: PrendaParaImprimir['vehiculo']): string {
  return vehiculo.condicion === '0km' ? '0 KILÓMETRO' : ''
}

// Confirmado "PRIVADO" para uso particular. Sin evidencia real para "comercial".
function formatearUso(vehiculo: PrendaParaImprimir['vehiculo']): string {
  return vehiculo.uso === 'particular' ? 'PRIVADO' : ''
}

// Domicilio del deudor en una sola línea: "{calle} {numero} ({cp}) {localidad}, {provincia}".
// La muestra real corta en "BUENOS" (le falta "AIRES") por ancho de campo —
// se arma el string completo igual, ya que el motor no trunca.
function formatearDomicilioCompleto(persona: PersonaParaImprimir | undefined): string {
  if (!persona?.calle) return ''
  const numero = persona.numero ? ` ${persona.numero}` : ''
  const cp = persona.cp ? ` (${persona.cp})` : ''
  const localidad = persona.localidad ? ` ${persona.localidad}` : ''
  const provincia = persona.provincia ? `, ${persona.provincia}` : ''
  return `${persona.calle}${numero}${cp}${localidad}${provincia}`
}

function capitalizar(estadoCivil?: string): string {
  const valor = (estadoCivil ?? '').trim()
  if (!valor) return ''
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase()
}

