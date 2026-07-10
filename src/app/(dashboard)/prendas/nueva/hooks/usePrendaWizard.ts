import { create } from 'zustand'
import type { ContratoWizard, FinancieraWizard, TitularWizard, VehiculoWizard } from '@/types'

const MAX_TITULARES = 4
const TOTAL_PASOS = 5

function crearTitularVacio(): TitularWizard {
  return {
    id: crypto.randomUUID(),
    cuitDni: '',
    nombre: '',
    apellido: '',
    nacionalidad: '',
    edad: '',
    estadoCivil: '',
    conyuge: '',
    telefono: '',
    email: '',
    calle: '',
    numero: '',
    localidad: '',
    provincia: '',
    profesion: '',
    porcentaje: 100,
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
    condicion: '',
    uso: '',
    patente: '',
    color: '',
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
    cantidadCuotas: '',
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
  }
}

interface EstadoPrendaWizard {
  pasoActual: number
  titulares: TitularWizard[]
  vehiculo: VehiculoWizard
  financiera: FinancieraWizard
  contrato: ContratoWizard

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
}

export const usePrendaWizard = create<EstadoPrendaWizard>((set) => ({
  pasoActual: 1,
  titulares: [crearTitularVacio()],
  vehiculo: vehiculoInicial(),
  financiera: financieraInicial(),
  contrato: contratoInicial(),

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
}))
