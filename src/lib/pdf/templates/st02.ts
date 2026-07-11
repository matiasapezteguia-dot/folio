import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial del ST-02 (Legal, 612×1008pt) — se imprime
// sobre el papel del formulario físico, sin fondo digital.
export const ST02_TAMANO_PAGINA: [number, number] = [612, 1008]
export const ST02_CANTIDAD_PAGINAS = 2

// Coordenadas calibradas cruzando scripts/referencias/02_pagina*_impresion_campos.pdf
// (overlay de Autoforms con el NOMBRE de cada campo en su posición) contra
// scripts/referencias/02_pagina*_impresion_datos_reales.pdf (mismo overlay con
// datos reales cargados) — cada par (x,y) coincide exactamente entre ambos PDFs,
// lo que confirma la identidad de cada campo.
//
// La página 2 del PDF de datos reales viene sin ningún contenido (trámite de
// ejemplo no la usó), así que ningún campo de página 2 tiene evidencia real
// todavía — quedan comentados con su posición conocida (solo por el nombre
// visible en el PDF de campos) hasta calibrarlos contra un caso real.
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
    { texto: solicitante?.nombreCompleto ?? '', x: 126.96, y: 510.48, size: 9, pagina: 1 },
    { texto: solicitante?.tipoDocumento === 'DNI' ? 'x' : '', x: 135.36, y: 429.24, size: 9, pagina: 1 },
    { texto: solicitante?.dni ? `D.N.I.: ${solicitante.dni}` : '', x: 126.96, y: 417.72, size: 9, pagina: 1 },
    { texto: solicitante?.autoridadExpedidora ?? '', x: 257.76, y: 416.04, size: 9, pagina: 1 },

    // Vehículo
    { texto: vehiculo.marca ?? '', x: 333.36, y: 423.24, size: 9, pagina: 1 },
    { texto: vehiculo.tipo ?? '', x: 328.56, y: 413.64, size: 9, pagina: 1 },
    { texto: vehiculo.modelo ?? '', x: 336.96, y: 405.24, size: 9, pagina: 1 },
    { texto: vehiculo.marcaMotor ?? '', x: 357.36, y: 396.84, size: 9, pagina: 1 },
    { texto: vehiculo.numeroMotor ?? '', x: 363.36, y: 386.04, size: 9, pagina: 1 },
    { texto: vehiculo.marcaChasis ?? '', x: 359.76, y: 376.44, size: 9, pagina: 1 },
    { texto: vehiculo.numeroChasis ?? '', x: 365.76, y: 368.04, size: 9, pagina: 1 },

    // Campos con posición conocida (PDF de campos) pero sin evidencia real
    // todavía — formato sin confirmar:
    // { texto: vehiculo.patente ?? '', x: 228.96, y: 890.04, size: 9, pagina: 1 }, // Patente
    // { texto: vehiculo.patente ?? '', x: 394.56, y: 432.84, size: 9, pagina: 1 }, // Patente2 (segunda mención, campo distinto en el form)
    // { texto: '', x: 167.76, y: 472.08, size: 9, pagina: 1 }, // Apoderado — sin campo equivalente en PrendaParaImprimir todavía
    // { texto: '', x: 126.96, y: 372.84, size: 9, pagina: 1 }, // Fecha — sin evidencia del formato (¿día/mes/año separados como en ST-03?)

    // Página 2 — sin ningún dato real de referencia, solo nombres de campo
    // conocidos vía el PDF de campos. Coordenadas candidatas sin confirmar:
    // { texto: '', x: 197.52, y: 949.68, size: 9, pagina: 2 }, // Solicitante
    // { texto: '', x: 59.52, y: 932.88, size: 9, pagina: 2 },  // DiaOrdena
    // { texto: '', x: 77.52, y: 932.88, size: 9, pagina: 2 },  // MesOrdena
    // { texto: '', x: 99.12, y: 932.88, size: 9, pagina: 2 },  // AnoOrdena
    // { texto: '', x: 129.12, y: 932.88, size: 9, pagina: 2 }, // DiaLevanta
    // { texto: '', x: 151.92, y: 932.88, size: 9, pagina: 2 }, // MesLevanta
    // { texto: '', x: 172.32, y: 932.88, size: 9, pagina: 2 }, // AnoLevanta
    // { texto: '', x: 197.52, y: 932.88, size: 9, pagina: 2 }, // Condomino
    // { texto: '', x: 217.92, y: 899.28, size: 9, pagina: 2 }, // DNI (checkbox tipo doc)
    // { texto: '', x: 240.72, y: 899.28, size: 9, pagina: 2 }, // LC
    // { texto: '', x: 263.49, y: 899.28, size: 9, pagina: 2 }, // LE
    // { texto: '', x: 307.88, y: 899.28, size: 9, pagina: 2 }, // DNIE
    // { texto: '', x: 330.72, y: 899.28, size: 9, pagina: 2 }, // CI
    // { texto: '', x: 353.52, y: 899.28, size: 9, pagina: 2 }, // Pasap
    // { texto: '', x: 54.72, y: 896.88, size: 9, pagina: 2 },  // Juzgado
    // { texto: '', x: 197.52, y: 881.28, size: 9, pagina: 2 }, // NroDoc
    // { texto: '', x: 280.32, y: 881.28, size: 9, pagina: 2 }, // Autoridad
    // { texto: '', x: 54.72, y: 877.68, size: 9, pagina: 2 },  // Secretaria
    // { texto: '', x: 197.52, y: 865.68, size: 9, pagina: 2 }, // Personeria
    // { texto: '', x: 197.52, y: 850.08, size: 9, pagina: 2 }, // NroInscr
    // { texto: '', x: 309.12, y: 850.08, size: 9, pagina: 2 }, // DiaInscrTit
    // { texto: '', x: 328.32, y: 850.08, size: 9, pagina: 2 }, // MesInscrTit
    // { texto: '', x: 349.92, y: 850.08, size: 9, pagina: 2 }, // AnoInscrTit
    // { texto: '', x: 105.12, y: 497.76, size: 9, pagina: 2 }, // Obs
    // { texto: '', x: 69.12, y: 420.48, size: 9, pagina: 2 },  // Autorizo
    // { texto: '', x: 273.12, y: 420.48, size: 9, pagina: 2 }, // TDocNro
  ]
}
