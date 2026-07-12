import { create } from 'zustand'
import type {
  ApoderadoWizard,
  ContratoWizard,
  FinancieraWizard,
  GaranteWizard,
  PrendaDeudorSolidarioWizard,
  TitularWizard,
  VehiculoWizard,
} from '@/types'

const MAX_TITULARES = 4
export const MAX_DEUDORES_SOLIDARIOS = 4
const TOTAL_PASOS = 6

export function crearApoderadoVacio(): ApoderadoWizard {
  return {
    id: crypto.randomUUID(),
    nombreApellido: '',
    tipoDocumento: '',
    numeroDocumento: '',
    tipoPoder: '',
    datosPoder: '',
  }
}

function crearTitularVacio(): TitularWizard {
  return {
    id: crypto.randomUUID(),
    cuitDni: '',
    nombre: '',
    apellido: '',
    nacionalidad: '',
    edad: '',
    estadoCivil: 'soltero',
    conyuge: '',
    telefono: '',
    email: '',
    calle: '',
    numero: '',
    localidad: '',
    provincia: '',
    profesion: '',
    porcentaje: 100,
    actuaMedianteApoderado: false,
    apoderado: undefined,
  }
}

function redistribuirPorcentajes(titulares: TitularWizard[]): TitularWizard[] {
  const cantidad = titulares.length
  if (cantidad <= 1) return titulares.map((titular) => ({ ...titular, porcentaje: 100 }))

  const base = Math.floor(100 / cantidad)
  const resto = 100 - base * cantidad

  return titulares.map((titular, indice) => ({
    ...titular,
    porcentaje: indice === cantidad - 1 ? base + resto : base,
  }))
}

function vehiculoInicial(): VehiculoWizard {
  return {
    marca: '',
    tipo: '',
    modelo: '',
    marcaMotor: '',
    numeroMotor: '',
    marcaChasis: '',
    numeroChasis: '',
    condicion: '0km',
    uso: 'particular',
    patente: '',
    color: '',
  }
}

function crearDeudorSolidarioVacio(): PrendaDeudorSolidarioWizard {
  return {
    id: crypto.randomUUID(),
    apellido: '',
    nombre: '',
    estadoCivil: '',
    profesion: '',
    nacionalidad: '',
    edad: '',
    fechaNacimiento: '',
    tipoDocumento: '',
    numeroDocumento: '',
    calle: '',
    numero: '',
    piso: '',
    depto: '',
    localidad: '',
    cp: '',
  }
}

function financieraInicial(): FinancieraWizard {
  return {
    idFinanciera: '',
    nombreFinanciera: '',
    tipoPrenda: '',
    acreedor: undefined,
  }
}

function contratoInicial(): ContratoWizard {
  return {
    monto: '',
    cantidadCuotas: '18',
    importeCuota: '',
    fechaPrimeraCuota: '',
    lugarPago: 'Domicilio del Acreedor',
    tasaMoraAnual: '27',
    tea: '',
    clase: 'fija',
    moneda: 'pesos',
    cotizacionBna: '',
    seguro: { enTramite: true, compania: '', poliza: '' },
    privilegiosPreexistentes: 'ninguno',
    privilegiosTexto: '',
    concepto: 'saldo_precio',
  }
}

interface EstadoPrendaWizard {
  pasoActual: number
  titulares: TitularWizard[]
  vehiculo: VehiculoWizard
  financiera: FinancieraWizard
  contrato: ContratoWizard
  // Deudores solidarios/garante: opcional, oculto por defecto en la UI
  // (checkbox "¿hay deudores solidarios o garantes?").
  tieneDeudoresOGarantes: boolean
  deudoresSolidarios: PrendaDeudorSolidarioWizard[]
  garante?: GaranteWizard

  siguiente: () => void
  anterior: () => void
  setPaso: (paso: number) => void
  resetear: () => void

  agregarTitular: () => void
  quitarTitular: (id: string) => void
  actualizarTitular: (id: string, cambios: Partial<TitularWizard>) => void
  actualizarVehiculo: (cambios: Partial<VehiculoWizard>) => void
  actualizarFinanciera: (cambios: Partial<FinancieraWizard>) => void
  actualizarContrato: (cambios: Partial<ContratoWizard>) => void

  setTieneDeudoresOGarantes: (valor: boolean) => void
  agregarDeudorSolidario: () => void
  quitarDeudorSolidario: (id: string) => void
  actualizarDeudorSolidario: (id: string, cambios: Partial<PrendaDeudorSolidarioWizard>) => void
  establecerGarante: (garante: GaranteWizard | undefined) => void
  actualizarGarante: (cambios: Partial<GaranteWizard>) => void
}

export const usePrendaWizard = create<EstadoPrendaWizard>((set) => ({
  pasoActual: 1,
  titulares: [crearTitularVacio()],
  vehiculo: vehiculoInicial(),
  financiera: financieraInicial(),
  contrato: contratoInicial(),
  tieneDeudoresOGarantes: false,
  deudoresSolidarios: [],
  garante: undefined,

  siguiente: () => set((estado) => ({ pasoActual: Math.min(estado.pasoActual + 1, TOTAL_PASOS) })),
  anterior: () => set((estado) => ({ pasoActual: Math.max(estado.pasoActual - 1, 1) })),
  setPaso: (paso) => set({ pasoActual: Math.min(Math.max(paso, 1), TOTAL_PASOS) }),
  resetear: () =>
    set({
      pasoActual: 1,
      titulares: [crearTitularVacio()],
      vehiculo: vehiculoInicial(),
      financiera: financieraInicial(),
      contrato: contratoInicial(),
      tieneDeudoresOGarantes: false,
      deudoresSolidarios: [],
      garante: undefined,
    }),

  agregarTitular: () =>
    set((estado) => {
      if (estado.titulares.length >= MAX_TITULARES) return estado
      return { titulares: redistribuirPorcentajes([...estado.titulares, crearTitularVacio()]) }
    }),

  quitarTitular: (id) =>
    set((estado) => {
      if (estado.titulares.length <= 1) return estado
      return { titulares: redistribuirPorcentajes(estado.titulares.filter((t) => t.id !== id)) }
    }),

  actualizarTitular: (id, cambios) =>
    set((estado) => ({
      titulares: estado.titulares.map((titular) =>
        titular.id === id ? { ...titular, ...cambios } : titular
      ),
    })),

  actualizarVehiculo: (cambios) =>
    set((estado) => ({ vehiculo: { ...estado.vehiculo, ...cambios } })),

  actualizarFinanciera: (cambios) =>
    set((estado) => ({ financiera: { ...estado.financiera, ...cambios } })),

  actualizarContrato: (cambios) =>
    set((estado) => ({ contrato: { ...estado.contrato, ...cambios } })),

  setTieneDeudoresOGarantes: (valor) => set({ tieneDeudoresOGarantes: valor }),

  agregarDeudorSolidario: () =>
    set((estado) => {
      if (estado.deudoresSolidarios.length >= MAX_DEUDORES_SOLIDARIOS) return estado
      return { deudoresSolidarios: [...estado.deudoresSolidarios, crearDeudorSolidarioVacio()] }
    }),

  quitarDeudorSolidario: (id) =>
    set((estado) => ({
      deudoresSolidarios: estado.deudoresSolidarios.filter((deudor) => deudor.id !== id),
    })),

  actualizarDeudorSolidario: (id, cambios) =>
    set((estado) => ({
      deudoresSolidarios: estado.deudoresSolidarios.map((deudor) =>
        deudor.id === id ? { ...deudor, ...cambios } : deudor
      ),
    })),

  establecerGarante: (garante) => set({ garante }),

  actualizarGarante: (cambios) =>
    set((estado) => ({ garante: { ...(estado.garante ?? { nombre: '', dni: '', domicilio: '' }), ...cambios } })),
}))
