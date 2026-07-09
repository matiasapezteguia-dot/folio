// ============================================
// MOTOR DE PDF — tipos genéricos
// ============================================

export interface CampoPDF {
  texto: string
  x: number
  y: number
  size?: number
  font?: string
}

// ============================================
// DATOS PARA IMPRESIÓN — vista aplanada, específica
// de lo que un template de formulario necesita para
// posicionar texto. No es un tipo de la base de datos.
// ============================================

export interface PersonaParaImprimir {
  nombreCompleto: string
  cuit?: string
  dni?: string
  domicilio?: string
  localidad?: string
  provincia?: string
  estadoCivil?: string
}

export interface VehiculoParaImprimir {
  marca?: string
  modelo?: string
  tipo?: string
  patente?: string
  numeroMotor?: string
  numeroChasis?: string
  marcaMotor?: string
  marcaChasis?: string
}

export interface ContratoParaImprimir {
  fecha?: string
  lugar?: string
  monto?: number
  cantidadCuotas?: number
  importeCuota?: number
  grado?: 1 | 2 | 3 | 4
}

export interface PrendaParaImprimir {
  id: string
  contrato: ContratoParaImprimir
  acreedor: PersonaParaImprimir
  deudores: PersonaParaImprimir[]
  vehiculo: VehiculoParaImprimir
}
