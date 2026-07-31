import type { CampoPDF, PersonaParaImprimir, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial del ST-03 (Legal, 612×1008pt) — se imprime
// sobre el papel del formulario físico, sin fondo digital.
export const ST03_TAMANO_PAGINA: [number, number] = [612, 1008]
export const ST03_CANTIDAD_PAGINAS = 2

// Coordenadas calibradas a partir de scripts/referencias/st03_pagina*_datos_reales.pdf
// (overlays de Autoforms con datos reales, posicionados sobre el ST-03 físico).
// Columnas: ACREEDOR entre x≈70-285, DEUDOR entre x≈290-540.
// Campos sin evidencia en esos PDFs (lugar, patente, cantidadCuotas, importeCuota,
// checkboxes de estado civil distintos de "casado", checkbox de tipo de documento
// distinto de "DNI") quedan pendientes de calibración.
export function buildST03Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { contrato, acreedor, deudores, vehiculo } = data
  const deudorPrincipal = deudores[0]
  const { dia, mes, anio } = parsearFecha(contrato.fecha)
  const inscripcion = parsearFecha(acreedor.fechaInscripcion)
  const nacimiento = parsearFecha(deudorPrincipal?.fechaNacimiento)

  return [
    // Fecha de celebración del contrato
    { id: 'fecha_contrato_dia', texto: dia, x: 135.72, y: 920.76, size: 9, pagina: 1, grupo: 'fecha_contrato' },
    { id: 'fecha_contrato_mes', texto: mes, x: 154.92, y: 920.76, size: 9, pagina: 1, grupo: 'fecha_contrato' },
    { id: 'fecha_contrato_anio', texto: anio, x: 174.12, y: 920.76, size: 9, pagina: 1, grupo: 'fecha_contrato' },

    // Monto del contrato
    { id: 'monto_contrato', texto: contrato.monto != null ? `$${formatearMonto(contrato.monto)}` : '', x: 121.32, y: 903.96, size: 9, pagina: 1 },

    // Grado de la prenda
    { id: 'grado_prenda', texto: contrato.grado ? `${contrato.grado}°` : '', x: 318.12, y: 407.16, size: 9, pagina: 1 },

    // ACREEDOR
    { id: 'acreedor_cuit', texto: acreedor.cuit ? `CUIT/CUIL: ${acreedor.cuit}` : '', x: 177.72, y: 859.56, size: 9, pagina: 1 },
    { id: 'acreedor_nombre', texto: acreedor.nombreCompleto ?? '', x: 121.32, y: 847.56, size: 9, pagina: 1 },
    { id: 'acreedor_tel_email', texto: formatearTelefonoEmail(acreedor, ':'), x: 121.32, y: 804, size: 9, pagina: 1 },
    { id: 'acreedor_calle', texto: acreedor.calle ?? '', x: 121.32, y: 795.96, size: 9, pagina: 1 },
    { id: 'acreedor_numero', texto: acreedor.numero ?? '', x: 121.32, y: 779.16, size: 9, pagina: 1 },
    { id: 'acreedor_piso', texto: acreedor.piso ?? '', x: 169.32, y: 779.16, size: 9, pagina: 1 },
    { id: 'acreedor_cp', texto: acreedor.cp ?? '', x: 237.72, y: 779.16, size: 9, pagina: 1 },
    { id: 'acreedor_localidad', texto: acreedor.localidad ?? '', x: 121.32, y: 762.36, size: 9, pagina: 1 },
    { id: 'acreedor_personeria_otorgada_por', texto: acreedor.personeriaOtorgadaPor ?? '', x: 120.12, y: 610.8, size: 9, pagina: 1 },
    { id: 'acreedor_inscripcion_registral', texto: acreedor.inscripcionRegistral ?? '', x: 118.92, y: 579.96, size: 9, pagina: 1 },
    { id: 'acreedor_inscripcion_dia', texto: inscripcion.dia, x: 222.12, y: 579.96, size: 9, pagina: 1, grupo: 'acreedor_inscripcion' },
    { id: 'acreedor_inscripcion_mes', texto: inscripcion.mes, x: 244.92, y: 579.96, size: 9, pagina: 1, grupo: 'acreedor_inscripcion' },
    { id: 'acreedor_inscripcion_anio', texto: aDosDigitos(inscripcion.anio), x: 266.52, y: 579.96, size: 9, pagina: 1, grupo: 'acreedor_inscripcion' },

    // DEUDOR
    { id: 'deudor_cuit', texto: deudorPrincipal?.cuit ? `CUIT/CUIL: ${deudorPrincipal.cuit}` : '', x: 330.71, y: 859.56, size: 9, pagina: 1 },
    { id: 'deudor_nombre', texto: deudorPrincipal?.nombreCompleto ?? '', x: 294.12, y: 847.56, size: 9, pagina: 1 },
    { id: 'deudor_nacionalidad_sexo', texto: formatearNacionalidadSexo(deudorPrincipal), x: 294.12, y: 816, size: 9, pagina: 1 },
    { id: 'deudor_profesion', texto: deudorPrincipal?.profesion ? `Profesión:${deudorPrincipal.profesion}` : '', x: 294.12, y: 810, size: 9, pagina: 1 },
    { id: 'deudor_tel_email', texto: formatearTelefonoEmail(deudorPrincipal, ': '), x: 294.12, y: 804, size: 9, pagina: 1 },
    { id: 'deudor_calle', texto: deudorPrincipal?.calle ?? '', x: 294.14, y: 795.96, size: 9, pagina: 1 },
    { id: 'deudor_numero', texto: deudorPrincipal?.numero ?? '', x: 294.13, y: 779.16, size: 9, pagina: 1 },
    { id: 'deudor_cp', texto: deudorPrincipal?.cp ?? '', x: 414.12, y: 779.16, size: 9, pagina: 1 },
    { id: 'deudor_localidad', texto: deudorPrincipal?.localidad ?? '', x: 294.14, y: 762.36, size: 9, pagina: 1 },
    { id: 'deudor_partido', texto: deudorPrincipal?.partido ?? '', x: 294.12, y: 745.56, size: 9, pagina: 1 },
    { id: 'deudor_provincia', texto: deudorPrincipal?.provincia ?? '', x: 397.35, y: 745.56, size: 9, pagina: 1 },
    { id: 'deudor_tipo_documento_dni', texto: deudorPrincipal?.tipoDocumento === 'DNI' ? 'x' : '', x: 308.52, y: 705.96, size: 9, pagina: 1 },
    { id: 'deudor_dni', texto: deudorPrincipal?.dni ?? '', x: 294.12, y: 686.76, size: 9, pagina: 1 },
    { id: 'deudor_autoridad_expedidora', texto: deudorPrincipal?.autoridadExpedidora ?? '', x: 358.92, y: 686.76, size: 9, pagina: 1 },
    { id: 'deudor_estado_civil_casado', texto: esCasado(deudorPrincipal?.estadoCivil) ? 'x' : '', x: 379.32, y: 651.96, size: 9, pagina: 1 },
    { id: 'deudor_nacimiento_dia', texto: nacimiento.dia, x: 291.72, y: 649.56, size: 9, pagina: 1, grupo: 'deudor_nacimiento' },
    { id: 'deudor_nacimiento_mes', texto: nacimiento.mes, x: 310.92, y: 649.56, size: 9, pagina: 1, grupo: 'deudor_nacimiento' },
    { id: 'deudor_nacimiento_anio', texto: aDosDigitos(nacimiento.anio), x: 331.32, y: 649.56, size: 9, pagina: 1, grupo: 'deudor_nacimiento' },
    { id: 'deudor_numero_nupcias', texto: deudorPrincipal?.numeroNupcias ?? '', x: 446.52, y: 649.56, size: 9, pagina: 1 },
    { id: 'deudor_conyuge', texto: deudorPrincipal?.conyuge ?? '', x: 291.72, y: 631.56, size: 9, pagina: 1 },

    // Vehículo
    { id: 'vehiculo_marca', texto: vehiculo.marca ?? '', x: 144.12, y: 470.76, size: 9, pagina: 1 },
    { id: 'vehiculo_tipo', texto: vehiculo.tipo ?? '', x: 134.52, y: 455.16, size: 9, pagina: 1 },
    { id: 'vehiculo_modelo', texto: vehiculo.modelo ?? '', x: 146.52, y: 439.56, size: 9, pagina: 1 },
    { id: 'vehiculo_marca_motor', texto: vehiculo.marcaMotor ?? '', x: 164.52, y: 422.76, size: 9, pagina: 1 },
    { id: 'vehiculo_numero_motor', texto: vehiculo.numeroMotor ?? '', x: 162.12, y: 407.16, size: 9, pagina: 1 },
    { id: 'vehiculo_marca_chasis', texto: vehiculo.marcaChasis ?? '', x: 175.32, y: 391.56, size: 9, pagina: 1 },
    { id: 'vehiculo_numero_chasis', texto: vehiculo.numeroChasis ?? '', x: 163.32, y: 375.96, size: 9, pagina: 1 },

    // Secciones H e I — checkboxes vistos como "X" sueltas en
    // st03_pagina1_datos_reales.pdf, sin un caso de referencia que cubra
    // las 3 opciones a la vez. Coordenadas candidatas sin confirmar todavía
    // (falta un PDF de referencia con estas secciones completas, o
    // verificación contra el formulario físico):
    // { texto: data.modalidades?.suscriptaAnteEncargado ? 'X' : '', x: 382.92, y: 488.76, size: 9, pagina: 1 }, // Sección H: ST suscripta ante encargado (SI)
    // { texto: data.modalidades?.clausulaActualizacion ? 'X' : '', x: 430.92, y: 415.56, size: 9, pagina: 1 }, // Sección I: Cláusula de actualización (SI/NO)
    // { texto: data.modalidades?.concepto === 'prestamo' ? 'X' : '', x: 430.92, y: 386.76, size: 9, pagina: 1 }, // Sección I: Concepto (saldo de precio / préstamo)
  ]
}

function formatearMonto(monto: number): string {
  return monto.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

// El acreedor y el deudor usan el mismo patrón "T.E.:...; email:..." pero con
// distinto espaciado tras los dos puntos, replicando exactamente el overlay real.
function formatearTelefonoEmail(persona: PersonaParaImprimir | undefined, separador: ':' | ': '): string {
  if (!persona?.telefono && !persona?.email) return ''
  const espacio = separador === ': ' ? ' ' : ''
  return `T.E.:${espacio}${persona.telefono ?? ''}; email:${espacio}${persona.email ?? ''}`
}

function formatearNacionalidadSexo(persona: PersonaParaImprimir | undefined): string {
  if (!persona?.nacionalidad && !persona?.sexo) return ''
  return `Nacionalidad: ${persona.nacionalidad ?? ''}; Sexo: ${persona.sexo ?? ''}`
}

function esCasado(estadoCivil?: string): boolean {
  return (estadoCivil ?? '').trim().toLowerCase() === 'casado'
}

// "FECHA DE NACIMIENTO" y "FECHA DE INSCRIPCIÓN" tienen una casilla de
// AÑO de solo 2 dígitos en el formulario físico (a diferencia de la fecha
// de celebración del contrato, que usa 4).
function aDosDigitos(anio: string): string {
  return anio.slice(-2)
}

function parsearFecha(fecha?: string): { dia: string; mes: string; anio: string } {
  if (!fecha) return { dia: '', mes: '', anio: '' }

  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const [, anio, mes, dia] = iso
    return { dia, mes, anio }
  }

  const conBarras = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (conBarras) {
    const [, dia, mes, anio] = conBarras
    return { dia, mes, anio }
  }

  return { dia: '', mes: '', anio: '' }
}
