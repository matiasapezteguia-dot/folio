// ============================================
// TIPOS BASE
// ============================================

export type TipoPersona = 'humana' | 'juridica'
export type EstadoCivil = 'soltero' | 'casado' | 'viudo' | 'divorciado' | 'nupcias'
export type TipoDocumento = 'DNI' | 'LE' | 'LC' | 'PASAPORTE'
export type Moneda = 'pesos' | 'usd'
export type ClasePrenda = 'fija' | 'flotante'
export type TipoPrenda = 'compania_financiera' | 'plan_ahorro'
export type TipoDeudor = 'deudor_solidario' | 'garante' | 'fiador' | 'liso_llano_pagador'
export type ConceptoPrenda = 'saldo_precio' | 'prestamo' | 'prestamo_garantia_reciproca'
export type EstadoFormulario = 'borrador' | 'generado' | 'impreso' | 'anulado'
export type EstadoTramite = 'borrador' | 'generado' | 'impreso' | 'anulado'
export type FormaAdquisicion = 'compra' | 'donacion' | 'sucesion' | 'premio' | 'otros'
export type VentaTipo = 'convencional' | 'directa'

// ============================================
// AUDITORÍA (base para todas las entidades)
// ============================================

export interface Auditoria {
  fecha_creacion?: string
  fecha_modificacion?: string
  fecha_baja?: string
  id_usuario?: string
}

// ============================================
// DOMICILIO
// ============================================

export interface Domicilio extends Auditoria {
  id: string
  calle?: string
  numero?: string
  piso?: string
  departamento?: string
  barrio?: string
  codigo_postal?: string
  localidad?: string
  partido?: string
  provincia?: string
}

// ============================================
// PERSONA
// ============================================

export interface Persona extends Auditoria {
  id: string
  tipo: TipoPersona
  tilde_acreedor_prendario?: boolean
  cuit?: string
  dni?: string
  apellido?: string
  nombre?: string
  profesion?: string
  telefono?: string
  mail?: string
  sexo?: string
  lugar_nacimiento?: string
  fecha_nacimiento?: string
  nacionalidad?: string
  tipo_documento?: TipoDocumento
  estado_civil?: EstadoCivil
  n_nupcias?: number
  id_pareja?: string
  // domicilios
  id_domicilio_legal?: string
  id_domicilio_real?: string
  id_domicilio_postal?: string
  id_domicilio_especial?: string
  // persona jurídica
  denominacion?: string
  objeto_social?: string
  personeria_otorgada_por?: string
  n_inscripcion?: string
  fecha_contrato_const?: string
  fecha_inscripcion?: string
  n_inscripcion_acreedores_prendarios?: string
}

export interface PersonaApoderado extends Auditoria {
  id: string
  id_persona: string
  id_apoderado: string
  caracter_invocado?: string
}

export interface PersonaPropietario extends Auditoria {
  id: string
  id_persona: string
  id_propietario: string
  orden?: number
  porcentaje?: number
}

export interface PersonaPep extends Auditoria {
  id: string
  id_persona: string
  cargo_funcion_jerarquia_dependencia?: string
  relacion_con_pep?: string
}

export interface PersonaSujetoObligado extends Auditoria {
  id: string
  id_persona: string
  tipo_sujeto?: string
  n_control?: string
  fecha_registro?: string
}

// ============================================
// VEHÍCULO
// ============================================

export interface MarcaVehiculo extends Auditoria {
  id: string
  nombre: string
}

export interface ModeloVehiculo extends Auditoria {
  id: string
  nombre: string
}

export interface TipoVehiculo extends Auditoria {
  id: string
  nombre: string
}

export interface EspecificacionVehiculo extends Auditoria {
  id: string
  id_marca?: string
  id_modelo?: string
  id_tipo?: string
  numero_certificado?: string
  anio_fabricacion?: number
  modelo_anio?: number
  n_ctrl_titulo?: string
  n_ctrl_cedula?: string
  id_marca_chasis?: string
  numero_chasis?: string
  id_marca_motor?: string
  numero_motor?: string
  uso?: string
}

// ============================================
// FORMA ADQUISICIÓN
// ============================================

export interface FormaAdquisicionEntity extends Auditoria {
  id: string
  lugar?: string
  fecha?: string
  moneda?: Moneda
  ceta_n?: string
  valor?: number
  id_forma?: FormaAdquisicion
  venta_tipo?: VentaTipo
  id_comerciante_habitualista?: string
  id_apoderado?: string
  facturado_por?: string
}

// ============================================
// TRÁMITE
// ============================================

export interface Tramite extends Auditoria {
  id: string
  id_especificacion_vehiculo?: string
  id_forma_adquisicion?: string
  estado?: EstadoTramite
  id_prenda?: string
}

export interface TramiteTitular extends Auditoria {
  id: string
  id_tramite: string
  id_titular: string
  porcentaje?: number
  orden: number
}

// ============================================
// PRENDA
// ============================================

export interface Contrato extends Auditoria {
  id: string
  lugar?: string
  fecha?: string
  monto?: number
  clase?: ClasePrenda
  moneda?: Moneda
  pagares?: 'con' | 'sin'
  grupo?: string
  orden?: string
  traslado_tilde?: boolean
  cantidad_cuotas?: number
  importe_cuota?: number
  vencimiento_primer_cuota?: string
  vencimiento_ultima_cuota?: string
}

export interface TasasPenalidadesSeguros extends Auditoria {
  id: string
  tna?: number
  tea?: number
  tem?: number
  pun?: number
  pen?: number
  canc?: number
  ant?: number
  s_vida?: number
}

export interface CostoFinancieroTotal extends Auditoria {
  id: string
  cft?: number
  cft_tea_con_iva?: number
  cft_tea_sin_iva?: number
  cftna_con_iva?: number
  cftna_sin_iva?: number
}

export interface Uva extends Auditoria {
  id: string
  fecha?: string
  monto?: number
  capital?: number
  valor_uva?: number
}

export interface Prenda extends Auditoria {
  id: string
  id_tramite: string
  id_acreedor_prendario: string
  id_contrato?: string
  id_tasas_penalidades?: string
  id_costo_financiero?: string
  id_uva?: string
  uva_tilde?: boolean
}

export interface PrendaDeudor extends Auditoria {
  id: string
  id_prenda: string
  id_deudor: string
  tipo?: TipoDeudor
  orden: number
}

// ============================================
// FORMULARIOS
// ============================================

export interface TipoFormulario extends Auditoria {
  id: string
  nombre: string
}

export interface Formulario extends Auditoria {
  id: string
  id_tramite: string
  id_tipo_formulario: string
  url_pdf?: string
  estado?: EstadoFormulario
}

export interface Formulario03 extends Auditoria {
  id: string
  id_formulario: string
  id_prenda: string
  rubro_h?: boolean
  rubro_i?: boolean
  grado?: 1 | 2 | 3 | 4
  clausula_actualizacion?: boolean
  concepto?: ConceptoPrenda
}

export interface FormularioPrenda extends Auditoria {
  id: string
  id_formulario: string
  tipo: TipoPrenda
  id_template_acreedor?: string
  texto_generado?: string
}

export interface TemplateAcreedor extends Auditoria {
  id: string
  id_financiera: string
  tipo_prenda: TipoPrenda
  texto_documentacion?: string
  version?: string
  fecha_vigencia_desde?: string
}

// ============================================
// TIPOS COMPUESTOS (para queries con joins)
// ============================================

export interface TramiteCompleto extends Tramite {
  especificacion_vehiculo?: EspecificacionVehiculo
  titulares?: (TramiteTitular & { persona?: Persona })[]
  prenda?: PrendaCompleta
}

export interface PrendaCompleta extends Prenda {
  acreedor_prendario?: Persona
  contrato?: Contrato
  tasas_penalidades?: TasasPenalidadesSeguros
  costo_financiero?: CostoFinancieroTotal
  deudores?: (PrendaDeudor & { persona?: Persona })[]
}

export interface FormularioCompleto extends Formulario {
  tipo_formulario?: TipoFormulario
  formulario_03?: Formulario03
  formulario_prenda?: FormularioPrenda
}

// ============================================
// IMPRESORA
// ============================================

export interface Impresora extends Auditoria {
  id: string
  id_usuario: string
  nombre: string
  offset_x: number
  offset_y: number
}