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
    lugarCelebracion: '',
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

  // Id devuelto por guardar_tramite_completo tras un guardado exitoso, o del
  // trámite cargado vía cargarTramiteExistente. Para Paso5Revision.tsx:
  // guardar_tramite_completo no es idempotente (crea
  // tramite/especificacion_vehiculo/contrato/prenda/tasas_penalidades_seguros
  // con INSERT simple en cada llamada), así que en modo alta este valor es
  // lo que bloquea el botón tras un guardado exitoso, para no reintentar
  // (evita duplicados) — ver esEdicion para la distinción con modo edición.
  idTramiteGuardado?: string
  // true cuando el wizard se abrió reabriendo un trámite existente
  // (cargarTramiteExistente), no armando uno nuevo. A diferencia del alta,
  // en edición el botón de guardado nunca se bloquea tras un guardado
  // exitoso: actualizar_tramite_completo es una actualización sobre la
  // misma fila, re-guardar no duplica nada.
  esEdicion: boolean

  // Paso "ajuste-impresion" (entre Contrato y Revisión). idImpresoraSeleccionada
  // referencia impresora.id. offsetsImpresionPorImpresora está scopeado por
  // (impresora, formulario) — dos niveles, no un único mapa por impresora —
  // porque varios templates comparten campo_id (ej. "vehiculo_tipo" existe en
  // ST-03, ST-02 y Contrato Pág. 1): sin el segundo nivel, mover ese campo en
  // un documento desplazaría el mismo campo en los otros dentro de la misma
  // sesión del wizard. Cambiar de impresora o de documento y volver no pisa
  // ajustes de sesión sin guardar de la otra combinación.
  idImpresoraSeleccionada?: string
  offsetsImpresionPorImpresora: Record<string, Record<string, Record<string, OffsetCampo>>>
  // Combinaciones (impresora, formulario) cuyos defaults ya se cargaron desde
  // Supabase en ESTA sesión del wizard — precargar solo pasa la primera vez
  // que se selecciona cada combinación; volver a seleccionarla no debe
  // recargar (perdería ajustes de sesión sin guardar).
  impresorasConDefaultsCargados: Record<string, Record<string, true>>

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

  marcarTramiteGuardado: (id: string) => void
  // Puebla todo el store a partir de un trámite existente (mapTramiteDetalleAWizard)
  // y marca esEdicion — usado por /prendas/nueva cuando llega con ?id=.
  cargarTramiteExistente: (
    id: string,
    datos: {
      titulares: TitularWizard[]
      vehiculo: VehiculoWizard
      financiera: FinancieraWizard
      contrato: ContratoWizard
    }
  ) => void

  setTieneDeudoresOGarantes: (valor: boolean) => void
  agregarDeudorSolidario: () => void
  quitarDeudorSolidario: (id: string) => void
  actualizarDeudorSolidario: (id: string, cambios: Partial<PrendaDeudorSolidarioWizard>) => void
  establecerGarante: (garante: GaranteWizard | undefined) => void
  actualizarGarante: (cambios: Partial<GaranteWizard>) => void

  setImpresoraSeleccionada: (id: string | undefined) => void
  // Carga los defaults de campo_override para una combinación (impresora,
  // formulario) y la marca como "ya cargada esta sesión" en un solo paso
  // atómico — se llama una única vez por combinación (ver guardia en
  // PasoAjusteImpresion.tsx).
  precargarDefaultsImpresora: (idImpresora: string, formulario: string, offsets: Record<string, OffsetCampo>) => void
  // Nudge/drag de un campo puntual, dentro de los offsets de una impresora +
  // formulario. El movimiento en grupo (multi-selección) se resuelve en el
  // llamador iterando esta acción por cada id seleccionado.
  moverCampoImpresion: (
    idImpresora: string,
    formulario: string,
    campoId: string,
    deltaX: number,
    deltaY: number
  ) => void
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
  idTramiteGuardado: undefined,
  esEdicion: false,
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
      idTramiteGuardado: undefined,
      esEdicion: false,
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

  marcarTramiteGuardado: (id) => set({ idTramiteGuardado: id }),

  cargarTramiteExistente: (id, datos) =>
    set({
      pasoActual: 1,
      titulares: datos.titulares,
      vehiculo: datos.vehiculo,
      financiera: datos.financiera,
      contrato: datos.contrato,
      tieneDeudoresOGarantes: false,
      deudoresSolidarios: [],
      garante: undefined,
      idTramiteGuardado: id,
      esEdicion: true,
      idImpresoraSeleccionada: undefined,
      offsetsImpresionPorImpresora: {},
      impresorasConDefaultsCargados: {},
    }),

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

  precargarDefaultsImpresora: (idImpresora, formulario, offsets) =>
    set((estado) => ({
      offsetsImpresionPorImpresora: {
        ...estado.offsetsImpresionPorImpresora,
        [idImpresora]: { ...estado.offsetsImpresionPorImpresora[idImpresora], [formulario]: offsets },
      },
      impresorasConDefaultsCargados: {
        ...estado.impresorasConDefaultsCargados,
        [idImpresora]: { ...estado.impresorasConDefaultsCargados[idImpresora], [formulario]: true },
      },
    })),

  moverCampoImpresion: (idImpresora, formulario, campoId, deltaX, deltaY) =>
    set((estado) => {
      const offsetsImpresora = estado.offsetsImpresionPorImpresora[idImpresora] ?? {}
      const offsetsFormulario = offsetsImpresora[formulario] ?? {}
      const actual = offsetsFormulario[campoId] ?? { offsetX: 0, offsetY: 0 }
      return {
        offsetsImpresionPorImpresora: {
          ...estado.offsetsImpresionPorImpresora,
          [idImpresora]: {
            ...offsetsImpresora,
            [formulario]: {
              ...offsetsFormulario,
              [campoId]: { offsetX: actual.offsetX + deltaX, offsetY: actual.offsetY + deltaY },
            },
          },
        },
      }
    }),
}))
