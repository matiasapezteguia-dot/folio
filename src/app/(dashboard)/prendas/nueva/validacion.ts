import type { ClasePrenda, ContratoWizard, FinancieraWizard, TitularWizard, VehiculoWizard } from '@/types'

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ErroresTitular {
  cuitDni?: string
  nombre?: string
  apellido?: string
  nacionalidad?: string
  edad?: string
  estadoCivil?: string
  conyuge?: string
  telefono?: string
  email?: string
  calle?: string
  numero?: string
  localidad?: string
  provincia?: string
  profesion?: string
}

// DNTR Art. 1.8.1: teléfono y email de contacto son obligatorios para el titular/deudor.
export function validarTitular(titular: TitularWizard): ErroresTitular {
  const errores: ErroresTitular = {}

  if (!titular.cuitDni.trim()) errores.cuitDni = 'Ingresá el CUIT o DNI'
  if (!titular.nombre.trim()) errores.nombre = 'Ingresá el nombre'
  if (!titular.apellido.trim()) errores.apellido = 'Ingresá el apellido'
  if (!titular.nacionalidad.trim()) errores.nacionalidad = 'Ingresá la nacionalidad'
  if (!titular.edad.trim()) errores.edad = 'Ingresá la edad'
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

export interface ErroresContrato {
  monto?: string
  cantidadCuotas?: string
  importeCuota?: string
  fechaPrimeraCuota?: string
  lugarPago?: string
  cotizacionBna?: string
  privilegiosTexto?: string
  vehiculoColor?: string
}

export interface ValidacionPaso4 {
  valido: boolean
  errores: ErroresContrato
}

export function validarPaso4(contrato: ContratoWizard, vehiculo: VehiculoWizard): ValidacionPaso4 {
  const errores: ErroresContrato = {}

  if (!(Number(contrato.monto) > 0)) errores.monto = 'Ingresá el monto'
  if (!(Number(contrato.cantidadCuotas) > 0)) errores.cantidadCuotas = 'Ingresá la cantidad de cuotas'
  if (!(Number(contrato.importeCuota) > 0)) errores.importeCuota = 'Ingresá el importe por cuota'
  if (!contrato.fechaPrimeraCuota) errores.fechaPrimeraCuota = 'Ingresá la fecha de la primera cuota'
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
