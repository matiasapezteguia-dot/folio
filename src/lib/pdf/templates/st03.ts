import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Coordenadas aproximadas sobre el ST-03 (A4, origen abajo-izquierda) —
// pendientes de calibración con impresión de prueba sobre el formulario real.
export function buildST03Fields(data: PrendaParaImprimir): CampoPDF[] {
  const { contrato, acreedor, deudores, vehiculo } = data
  const deudorPrincipal = deudores[0]

  return [
    // Contrato
    { texto: contrato.lugar ?? '', x: 300, y: 780, size: 9 },
    { texto: contrato.fecha ?? '', x: 420, y: 780, size: 9 },
    { texto: formatearMonto(contrato.monto), x: 420, y: 760, size: 9 },
    { texto: vehiculo.patente ?? '', x: 480, y: 800, size: 9 },

    // Acreedor
    { texto: acreedor.nombreCompleto, x: 60, y: 700, size: 9 },
    { texto: acreedor.cuit ?? '', x: 60, y: 685, size: 9 },
    { texto: acreedor.domicilio ?? '', x: 60, y: 670, size: 9 },

    // Deudor principal
    { texto: deudorPrincipal?.nombreCompleto ?? '', x: 60, y: 600, size: 9 },
    { texto: deudorPrincipal?.dni ?? deudorPrincipal?.cuit ?? '', x: 60, y: 585, size: 9 },
    { texto: deudorPrincipal?.domicilio ?? '', x: 60, y: 570, size: 9 },
    { texto: deudorPrincipal?.estadoCivil ?? '', x: 60, y: 555, size: 9 },

    // Vehículo
    { texto: vehiculo.marca ?? '', x: 60, y: 500, size: 9 },
    { texto: vehiculo.modelo ?? '', x: 200, y: 500, size: 9 },
    { texto: vehiculo.tipo ?? '', x: 340, y: 500, size: 9 },
    { texto: vehiculo.numeroMotor ?? '', x: 60, y: 485, size: 9 },
    { texto: vehiculo.numeroChasis ?? '', x: 300, y: 485, size: 9 },

    // Modalidad del contrato
    { texto: contrato.grado ? String(contrato.grado) : '', x: 500, y: 500, size: 9 },
    { texto: contrato.cantidadCuotas ? String(contrato.cantidadCuotas) : '', x: 60, y: 440, size: 9 },
    { texto: contrato.importeCuota ? formatearMonto(contrato.importeCuota) : '', x: 200, y: 440, size: 9 },
  ]
}

function formatearMonto(monto?: number): string {
  if (monto == null) return ''
  return monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })
}
