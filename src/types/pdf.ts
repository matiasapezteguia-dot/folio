// ============================================
// MOTOR DE PDF — tipos genéricos
// ============================================

export interface CampoPDF {
  texto: string
  x: number
  y: number
  size?: number
  font?: string
  /** Página del PDF donde se dibuja (1-indexado). Por defecto 1. */
  pagina?: number
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
  edad?: string
  tipoDocumento?: 'DNI' | 'LE' | 'LC'
  autoridadExpedidora?: string
  calle?: string
  numero?: string
  piso?: string
  cp?: string
  localidad?: string
  partido?: string
  provincia?: string
  telefono?: string
  email?: string
  nacionalidad?: string
  sexo?: string
  profesion?: string
  estadoCivil?: string
  fechaNacimiento?: string
  numeroNupcias?: string
  conyuge?: string
  /** Solo para entes jurídicos (ej. acreedor financiero): datos de inscripción registral. */
  personeriaOtorgadaPor?: string
  inscripcionRegistral?: string
  fechaInscripcion?: string
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
  modeloAnio?: number
  condicion?: '0km' | 'usado'
  uso?: 'particular' | 'comercial'
}

export interface ContratoParaImprimir {
  fecha?: string
  lugar?: string
  monto?: number
  cantidadCuotas?: number
  importeCuota?: number
  grado?: 1 | 2 | 3 | 4
  /** Identificadores de plan de ahorro (FCA), no aplica a prendas de financiera. */
  grupo?: string
  orden?: string
}

// Secciones H e I del ST-03. Coordenadas todavía sin confirmar — ver
// comentario en buildST03Fields.
export interface ModalidadesContrato {
  suscriptaAnteEncargado?: boolean
  clausulaActualizacion?: boolean
  concepto?: 'saldo_precio' | 'prestamo'
}

export interface PrendaParaImprimir {
  id: string
  contrato: ContratoParaImprimir
  acreedor: PersonaParaImprimir
  deudores: PersonaParaImprimir[]
  vehiculo: VehiculoParaImprimir
  modalidades?: ModalidadesContrato
}
