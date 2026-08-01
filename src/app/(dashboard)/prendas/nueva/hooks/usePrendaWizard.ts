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
import type { OffsetCampo } from '@/lib/pdf/offsetsImpresion'

const MAX_TITULARES = 4
export const MAX_DEUDORES_SOLIDARIOS = 4
const TOTAL_PASOS = 7

// OffsetCampo (offsetX/offsetY, CampoPDF.id) vive en lib/pdf/offsetsImpresion.ts
// — compartido con la generación real del PDF, ver ese archivo. Acá vive
// solo en memoria durante el trámite actual; "Guardar como ajuste de esta
// impresora" lo persiste en Supabase vía campoOverrideService.
export type { OffsetCampo }

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
    fechaNacimiento: '',
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

  // Paso "ajuste-impresion" (entre Contrato y Revisión). idImpresoraSeleccionada
  // referencia impresora.id. offsetsImpresionPorImpresora está scopeado por
  // impresora (no un único mapa global) para que cambiar de impresora y
  // volver no pise ajustes de sesión sin guardar de la otra. campo_id es de
  // CampoPDF, hoy solo tiene sentido para ST-03 (único template con ids).
  idImpresoraSeleccionada?: string
  offsetsImpresionPorImpresora: Record<string, Record<string, OffsetCampo>>
  // Impresoras cuyos defaults ya se cargaron desde Supabase en ESTA sesión
  // del wizard — precargar solo pasa la primera vez que se selecciona cada
  // impresora; volver a seleccionarla no debe recargar (perdería ajustes de
  // sesión sin guardar).
  impresorasConDefaultsCargados: Record<string, true>

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

  setImpresoraSeleccionada: (id: string | undefined) => void
  // Carga los defaults de campo_override para una impresora y la marca como
  // "ya cargada esta sesión" en un solo paso atómico — se llama una única
  // vez por impresora (ver guardia en PasoAjusteImpresion.tsx).
  precargarDefaultsImpresora: (idImpresora: string, offsets: Record<string, OffsetCampo>) => void
  // Nudge/drag de un campo puntual, dentro de los offsets de una impresora.
  // El movimiento en grupo (multi-selección) se resuelve en el llamador
  // iterando esta acción por cada id seleccionado — todavía no implementado
  // (ver PasoAjusteImpresion.tsx).
  moverCampoImpresion: (idImpresora: string, campoId: string, deltaX: number, deltaY: number) => void
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
  idImpresoraSeleccionada: undefined,
  offsetsImpresionPorImpresora: {},
  impresorasConDefaultsCargados: {},

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
      idImpresoraSeleccionada: undefined,
      offsetsImpresionPorImpresora: {},
      impresorasConDefaultsCargados: {},
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

  setImpresoraSeleccionada: (id) => set({ idImpresoraSeleccionada: id }),

  precargarDefaultsImpresora: (idImpresora, offsets) =>
    set((estado) => ({
      offsetsImpresionPorImpresora: { ...estado.offsetsImpresionPorImpresora, [idImpresora]: offsets },
      impresorasConDefaultsCargados: { ...estado.impresorasConDefaultsCargados, [idImpresora]: true },
    })),

  moverCampoImpresion: (idImpresora, campoId, deltaX, deltaY) =>
    set((estado) => {
      const offsetsImpresora = estado.offsetsImpresionPorImpresora[idImpresora] ?? {}
      const actual = offsetsImpresora[campoId] ?? { offsetX: 0, offsetY: 0 }
      return {
        offsetsImpresionPorImpresora: {
          ...estado.offsetsImpresionPorImpresora,
          [idImpresora]: {
            ...offsetsImpresora,
            [campoId]: { offsetX: actual.offsetX + deltaX, offsetY: actual.offsetY + deltaY },
          },
        },
      }
    }),
}))
