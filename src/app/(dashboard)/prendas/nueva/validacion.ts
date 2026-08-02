import type {
  ApoderadoWizard,
  ClasePrenda,
  ContratoWizard,
  FinancieraWizard,
  GaranteWizard,
  PrendaDeudorSolidarioWizard,
  TipoPrenda,
  TitularWizard,
  VehiculoWizard,
} from '@/types'

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ErroresApoderado {
  nombreApellido?: string
  tipoDocumento?: string
  numeroDocumento?: string
  tipoPoder?: string
}

export function validarApoderado(apoderado: ApoderadoWizard): ErroresApoderado {
  const errores: ErroresApoderado = {}

  if (!apoderado.nombreApellido.trim()) {
    errores.nombreApellido = 'Ingresá el nombre y apellido del apoderado'
  }
  if (!apoderado.tipoDocumento) errores.tipoDocumento = 'Seleccioná el tipo de documento'
  if (!apoderado.numeroDocumento.trim()) errores.numeroDocumento = 'Ingresá el número de documento'
  if (!apoderado.tipoPoder) errores.tipoPoder = 'Seleccioná el tipo de poder'

  return errores
}

export interface ErroresTitular {
  cuitDni?: string
  nombre?: string
  apellido?: string
  nacionalidad?: string
  fechaNacimiento?: string
  estadoCivil?: string
  conyuge?: string
  telefono?: string
  email?: string
  calle?: string
  numero?: string
  localidad?: string
  provincia?: string
  profesion?: string
  apoderado?: ErroresApoderado
}

// DNTR Art. 1.8.1: teléfono y email de contacto son obligatorios para el titular/deudor.
// El apoderado no reemplaza al titular: si actúa mediante apoderado, sus datos
// también son obligatorios pero se validan además de los del titular, no en su lugar.
export function validarTitular(titular: TitularWizard): ErroresTitular {
  const errores: ErroresTitular = {}

  if (!titular.cuitDni.trim()) errores.cuitDni = 'Ingresá el CUIT o DNI'
  if (!titular.nombre.trim()) errores.nombre = 'Ingresá el nombre'
  if (!titular.apellido.trim()) errores.apellido = 'Ingresá el apellido'
  if (!titular.nacionalidad.trim()) errores.nacionalidad = 'Ingresá la nacionalidad'
  if (!titular.fechaNacimiento) errores.fechaNacimiento = 'Ingresá la fecha de nacimiento'
  if (!titular.estadoCivil) errores.estadoCivil = 'Seleccioná el estado civil'
  if (titular.estadoCivil === 'casado' && !titular.conyuge.trim()) {
    errores.conyuge = 'Ingresá el nombre y apellido del cónyuge'
  }
  if (!titular.telefono.trim()) errores.telefono = 'Ingresá el teléfono'
  if (!titular.email.trim()) {
    errores.email = 'Ingresá el email'
  } else if (!PATRON_EMAIL.test(titular.email.trim())) {
    errores.email = 'Ingresá un email válido'
  }
  if (!titular.calle.trim()) errores.calle = 'Ingresá la calle'
  if (!titular.numero.trim()) errores.numero = 'Ingresá el número'
  if (!titular.localidad.trim()) errores.localidad = 'Ingresá la localidad'
  if (!titular.provincia.trim()) errores.provincia = 'Ingresá la provincia'
  if (!titular.profesion.trim()) errores.profesion = 'Ingresá la profesión'

  if (titular.actuaMedianteApoderado) {
    const erroresApoderado = titular.apoderado
      ? validarApoderado(titular.apoderado)
      : {
          nombreApellido: 'Ingresá el nombre y apellido del apoderado',
          tipoDocumento: 'Seleccioná el tipo de documento',
          numeroDocumento: 'Ingresá el número de documento',
          tipoPoder: 'Seleccioná el tipo de poder',
        }
    if (Object.keys(erroresApoderado).length > 0) errores.apoderado = erroresApoderado
  }

  return errores
}

export interface ValidacionPaso1 {
  valido: boolean
  erroresPorTitular: ErroresTitular[]
  errorPorcentaje?: string
}

export function validarPaso1(titulares: TitularWizard[]): ValidacionPaso1 {
  const erroresPorTitular = titulares.map(validarTitular)
  const hayErroresDeCampos = erroresPorTitular.some((errores) => Object.keys(errores).length > 0)

  let errorPorcentaje: string | undefined
  if (titulares.length >= 2) {
    const suma = titulares.reduce((acumulado, titular) => acumulado + titular.porcentaje, 0)
    if (suma !== 100) {
      errorPorcentaje = `Los porcentajes deben sumar 100% (actual: ${suma}%)`
    }
  }

  return {
    valido: !hayErroresDeCampos && !errorPorcentaje,
    erroresPorTitular,
    errorPorcentaje,
  }
}

export interface ErroresVehiculo {
  marca?: string
  tipo?: string
  modelo?: string
  marcaMotor?: string
  numeroMotor?: string
  marcaChasis?: string
  numeroChasis?: string
  condicion?: string
  uso?: string
  color?: string
  patente?: string
}

export interface ValidacionPaso2 {
  valido: boolean
  errores: ErroresVehiculo
}

export function requiereColor(condicion: VehiculoWizard['condicion'], clase: ClasePrenda | ''): boolean {
  return condicion === '0km' && clase === 'flotante'
}

// DNTR: color obligatorio en prenda flotante sobre vehículo 0km. La clase de
// prenda se elige recién en el paso 4, por eso se recibe acá como parámetro.
export function validarPaso2(vehiculo: VehiculoWizard, clase: ClasePrenda | ''): ValidacionPaso2 {
  const errores: ErroresVehiculo = {}

  if (!vehiculo.marca.trim()) errores.marca = 'Ingresá la marca'
  if (!vehiculo.tipo.trim()) errores.tipo = 'Ingresá el tipo'
  if (!vehiculo.modelo.trim()) errores.modelo = 'Ingresá el modelo'
  if (!vehiculo.marcaMotor.trim()) errores.marcaMotor = 'Ingresá la marca del motor'
  if (!vehiculo.numeroMotor.trim()) errores.numeroMotor = 'Ingresá el número de motor'
  if (!vehiculo.marcaChasis.trim()) errores.marcaChasis = 'Ingresá la marca del chasis'
  if (!vehiculo.numeroChasis.trim()) errores.numeroChasis = 'Ingresá el número de chasis'
  if (!vehiculo.condicion) errores.condicion = 'Seleccioná la condición'
  if (!vehiculo.uso) errores.uso = 'Seleccioná el uso'
  if (vehiculo.condicion === 'usado' && !vehiculo.patente.trim()) {
    errores.patente = 'Ingresá el dominio/patente'
  }
  if (requiereColor(vehiculo.condicion, clase) && !vehiculo.color.trim()) {
    errores.color = 'El color es obligatorio en prenda flotante sobre 0km (DNTR)'
  }

  return { valido: Object.keys(errores).length === 0, errores }
}

export interface ErroresFinanciera {
  idFinanciera?: string
  tipoPrenda?: string
}

export interface ValidacionPaso3 {
  valido: boolean
  errores: ErroresFinanciera
}

export function validarPaso3(financiera: FinancieraWizard): ValidacionPaso3 {
  const errores: ErroresFinanciera = {}

  if (!financiera.idFinanciera) errores.idFinanciera = 'Seleccioná una financiera'
  if (!financiera.tipoPrenda) errores.tipoPrenda = 'Seleccioná el tipo de prenda'

  return { valido: Object.keys(errores).length === 0, errores }
}

export interface ErroresDeudorSolidario {
  apellido?: string
  nombre?: string
  estadoCivil?: string
  profesion?: string
  nacionalidad?: string
  edad?: string
  fechaNacimiento?: string
  tipoDocumento?: string
  numeroDocumento?: string
  calle?: string
  numero?: string
  localidad?: string
  cp?: string
}

// Plan de Ahorro (deudor solidario) usa edad; Compañía Financiera (codeudor)
// usa fecha de nacimiento real — ver contrato_fca_plan_ahorro_pag2.ts
// (EdadDS1..4) y contrato_fca_cia_financiera_pag2.ts (FechaNacCodeudor).
export function validarDeudorSolidario(
  deudor: PrendaDeudorSolidarioWizard,
  tipoPrenda: TipoPrenda | ''
): ErroresDeudorSolidario {
  const errores: ErroresDeudorSolidario = {}

  if (!deudor.apellido.trim()) errores.apellido = 'Ingresá el apellido'
  if (!deudor.nombre.trim()) errores.nombre = 'Ingresá el nombre'
  if (!deudor.estadoCivil) errores.estadoCivil = 'Seleccioná el estado civil'
  if (!deudor.profesion.trim()) errores.profesion = 'Ingresá la profesión'
  if (!deudor.nacionalidad.trim()) errores.nacionalidad = 'Ingresá la nacionalidad'

  if (tipoPrenda === 'compania_financiera') {
    if (!deudor.fechaNacimiento) errores.fechaNacimiento = 'Ingresá la fecha de nacimiento'
  } else if (!deudor.edad.trim()) {
    errores.edad = 'Ingresá la edad'
  }

  if (!deudor.tipoDocumento) errores.tipoDocumento = 'Seleccioná el tipo de documento'
  if (!deudor.numeroDocumento.trim()) errores.numeroDocumento = 'Ingresá el número de documento'
  if (!deudor.calle.trim()) errores.calle = 'Ingresá la calle'
  if (!deudor.numero.trim()) errores.numero = 'Ingresá el número'
  if (!deudor.localidad.trim()) errores.localidad = 'Ingresá la localidad'
  if (!deudor.cp.trim()) errores.cp = 'Ingresá el código postal'

  return errores
}

export interface ErroresGarante {
  nombre?: string
  dni?: string
  domicilio?: string
}

export function validarGarante(garante: GaranteWizard): ErroresGarante {
  const errores: ErroresGarante = {}

  if (!garante.nombre.trim()) errores.nombre = 'Ingresá el nombre'
  if (!garante.dni.trim()) errores.dni = 'Ingresá el DNI'
  if (!garante.domicilio.trim()) errores.domicilio = 'Ingresá el domicilio'

  return errores
}

export interface ValidacionPasoDeudoresGarantes {
  valido: boolean
  erroresPorDeudor: ErroresDeudorSolidario[]
  errorGarante?: ErroresGarante
}

// Sección opcional del wizard (checkbox "¿hay deudores solidarios o
// garantes?"): si está desmarcada, no hay nada que validar. La restricción
// de "Compañía Financiera admite un solo codeudor calibrado" es una
// advertencia de UI, no bloquea el avance — no se valida acá a propósito.
export function validarPasoDeudoresGarantes(
  tieneDeudoresOGarantes: boolean,
  deudoresSolidarios: PrendaDeudorSolidarioWizard[],
  garante: GaranteWizard | undefined,
  tipoPrenda: TipoPrenda | ''
): ValidacionPasoDeudoresGarantes {
  if (!tieneDeudoresOGarantes) {
    return { valido: true, erroresPorDeudor: [] }
  }

  const erroresPorDeudor = deudoresSolidarios.map((deudor) => validarDeudorSolidario(deudor, tipoPrenda))
  const errorGarante = garante ? validarGarante(garante) : undefined

  const hayErroresDeudores = erroresPorDeudor.some((errores) => Object.keys(errores).length > 0)
  const hayErrorGarante = errorGarante !== undefined && Object.keys(errorGarante).length > 0

  return {
    valido: !hayErroresDeudores && !hayErrorGarante,
    erroresPorDeudor,
    errorGarante: hayErrorGarante ? errorGarante : undefined,
  }
}

export interface ErroresContrato {
  monto?: string
  cantidadCuotas?: string
  importeCuota?: string
  fechaPrimeraCuota?: string
  lugarCelebracion?: string
  lugarPago?: string
  cotizacionBna?: string
  privilegiosTexto?: string
  vehiculoColor?: string
  concepto?: string
}

export interface ValidacionPaso4 {
  valido: boolean
  errores: ErroresContrato
}

export function validarPaso4(contrato: ContratoWizard, vehiculo: VehiculoWizard): ValidacionPaso4 {
  const errores: ErroresContrato = {}

  if (!contrato.concepto) errores.concepto = 'Seleccioná el concepto'
  if (!(Number(contrato.monto) > 0)) errores.monto = 'Ingresá el monto'
  if (!(Number(contrato.cantidadCuotas) > 0)) errores.cantidadCuotas = 'Ingresá la cantidad de cuotas'
  if (!(Number(contrato.importeCuota) > 0)) errores.importeCuota = 'Ingresá el importe por cuota'
  if (!contrato.fechaPrimeraCuota) errores.fechaPrimeraCuota = 'Ingresá la fecha de la primera cuota'
  if (!contrato.lugarCelebracion.trim()) errores.lugarCelebracion = 'Ingresá el lugar de celebración del contrato'
  if (!contrato.lugarPago.trim()) errores.lugarPago = 'Ingresá el lugar de pago'
  if (contrato.moneda === 'usd' && !contrato.cotizacionBna.trim()) {
    errores.cotizacionBna = 'Ingresá la cotización BNA tipo vendedor'
  }
  if (contrato.privilegiosPreexistentes === 'con_privilegios' && !contrato.privilegiosTexto.trim()) {
    errores.privilegiosTexto = 'Describí los privilegios preexistentes'
  }
  if (requiereColor(vehiculo.condicion, contrato.clase) && !vehiculo.color.trim()) {
    errores.vehiculoColor = 'Falta el color del vehículo, obligatorio en prenda flotante sobre 0km (paso 2)'
  }

  return { valido: Object.keys(errores).length === 0, errores }
}
