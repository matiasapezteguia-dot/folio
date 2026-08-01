import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial del ST-02 (Legal, 612×1008pt) — se imprime
// sobre el papel del formulario físico, sin fondo digital.
export const ST02_TAMANO_PAGINA: [number, number] = [612, 1008]
// La página 2 la completa exclusivamente el Registro Seccional (sellos,
// firmas, constancias registrales) — Folio nunca la genera, por eso el PDF
// de datos_reales de página 2 está vacío a propósito y este template solo
// produce página 1.
export const ST02_CANTIDAD_PAGINAS = 1

// Coordenadas calibradas cruzando scripts/referencias/02_pagina1_impresion_campos.pdf
// (overlay de Autoforms con el NOMBRE de cada campo en su posición) contra
// scripts/referencias/02_pagina1_impresion_datos_reales.pdf (mismo overlay con
// datos reales cargados) — cada par (x,y) coincide exactamente entre ambos PDFs,
// lo que confirma la identidad de cada campo.
//
// La checklist de 20 casilleros en x≈128 (motivo del trámite) tampoco tiene
// nombres visibles en el PDF de campos (todos aparecen como "X" suelto): se
// confirmó que el trámite de ejemplo marcó el último casillero (y≈581.64),
// pero sin el formulario físico no se puede saber a qué opción de la lista
// corresponde cada fila — queda sin usar hasta identificarlas.
export function buildST02Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { deudores, vehiculo } = data
  const solicitante = deudores[0]

  return [
    { id: 'solicitante_nombre', texto: solicitante?.nombreCompleto ?? '', x: 126.96, y: 510.48, size: 9, pagina: 1 },
    { id: 'solicitante_tipo_documento_dni', texto: solicitante?.tipoDocumento === 'DNI' ? 'x' : '', x: 135.36, y: 429.24, size: 9, pagina: 1 },
    { id: 'solicitante_dni', texto: solicitante?.dni ? `D.N.I.: ${solicitante.dni}` : '', x: 126.96, y: 417.72, size: 9, pagina: 1 },
    { id: 'solicitante_autoridad_expedidora', texto: solicitante?.autoridadExpedidora ?? '', x: 257.76, y: 416.04, size: 9, pagina: 1 },

    // Vehículo
    { id: 'vehiculo_marca', texto: vehiculo.marca ?? '', x: 333.36, y: 423.24, size: 9, pagina: 1 },
    { id: 'vehiculo_tipo', texto: vehiculo.tipo ?? '', x: 328.56, y: 413.64, size: 9, pagina: 1 },
    { id: 'vehiculo_modelo', texto: vehiculo.modelo ?? '', x: 336.96, y: 405.24, size: 9, pagina: 1 },
    { id: 'vehiculo_marca_motor', texto: vehiculo.marcaMotor ?? '', x: 357.36, y: 396.84, size: 9, pagina: 1 },
    { id: 'vehiculo_numero_motor', texto: vehiculo.numeroMotor ?? '', x: 363.36, y: 386.04, size: 9, pagina: 1 },
    { id: 'vehiculo_marca_chasis', texto: vehiculo.marcaChasis ?? '', x: 359.76, y: 376.44, size: 9, pagina: 1 },
    { id: 'vehiculo_numero_chasis', texto: vehiculo.numeroChasis ?? '', x: 365.76, y: 368.04, size: 9, pagina: 1 },

    // Campos con posición conocida (PDF de campos) pero sin evidencia real
    // todavía — formato sin confirmar:
    // { texto: vehiculo.patente ?? '', x: 228.96, y: 890.04, size: 9, pagina: 1 }, // Patente
    // { texto: vehiculo.patente ?? '', x: 394.56, y: 432.84, size: 9, pagina: 1 }, // Patente2 (segunda mención, campo distinto en el form)
    // { texto: '', x: 167.76, y: 472.08, size: 9, pagina: 1 }, // Apoderado — sin campo equivalente en PrendaParaImprimir todavía
    // { texto: '', x: 126.96, y: 372.84, size: 9, pagina: 1 }, // Fecha — sin evidencia del formato (¿día/mes/año separados como en ST-03?).
    // Al calibrar este campo NO asumir el mismo grupo (CampoPDF.grupo) que
    // fecha_contrato en st03.ts sin confirmar contra un PDF de referencia real
    // que efectivamente esté partido en 3 casillas — puede ser una sola casilla.
  ]
}
