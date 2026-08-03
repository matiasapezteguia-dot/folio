import { createClient } from '@/lib/supabase/client'
import { listarFinancieras } from '@/lib/services/financieraService'
import type {
  ClasePrenda,
  ContratoWizard,
  EstadoCivilWizard,
  FinancieraWizard,
  Moneda,
  PrendaWizardPayload,
  TitularWizard,
  TramiteDetalle,
  TramiteResumen,
  UsoVehiculo,
  VehiculoWizard,
} from '@/types'

export type GuardarTramitePayload = Pick<PrendaWizardPayload, 'titulares' | 'vehiculo' | 'financiera' | 'contrato'>

// Persiste el trámite armado por el wizard (tramite, especificacion_vehiculo,
// persona/domicilio de titulares y acreedor, tramite_titular, contrato,
// tasas_penalidades_seguros, prenda) en una sola transacción vía el RPC
// guardar_tramite_completo (scripts/referencias/guardar_tramite_completo.sql)
// — deudoresSolidarios/garante quedan fuera de alcance a propósito, ver ese
// archivo. Devuelve el id del tramite creado.
export async function guardarTramite(payload: GuardarTramitePayload): Promise<string> {
  if (!payload.financiera.acreedor?.cuit) {
    throw new Error('Falta el CUIT del acreedor: seleccioná una financiera antes de guardar')
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('guardar_tramite_completo', { payload })

    if (error) throw error
    if (!data) throw new Error('guardar_tramite_completo no devolvió el id del trámite')

    return data as string
  } catch (err) {
    const error = err as Error
    console.error('Error al guardar el trámite:', error.message)
    throw error
  }
}

// Actualiza un trámite existente (mismas 7 tablas que guardarTramite, pero
// UPDATE en vez de INSERT — ver actualizar_tramite_completo.sql) vía el RPC
// actualizar_tramite_completo. A diferencia de guardarTramite, es seguro
// llamarla repetidas veces: es una actualización sobre la misma fila, no
// crea duplicados.
export async function actualizarTramite(idTramite: string, payload: GuardarTramitePayload): Promise<void> {
  if (!payload.financiera.acreedor?.cuit) {
    throw new Error('Falta el CUIT del acreedor: seleccioná una financiera antes de guardar')
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.rpc('actualizar_tramite_completo', { id_tramite: idTramite, payload })

    if (error) throw error
  } catch (err) {
    const error = err as Error
    console.error('Error al actualizar el trámite:', error.message)
    throw error
  }
}

// Traduce los RAISE EXCEPTION conocidos de guardar_tramite_completo.sql y
// actualizar_tramite_completo.sql (y el chequeo de acreedor.cuit de acá
// arriba) a un mensaje entendible para el gestor. El detalle técnico ya
// quedó en console.error de guardarTramite()/actualizarTramite() — esto es
// solo para mostrar en pantalla.
export function mensajeErrorGuardarTramite(error: unknown): string {
  const mensaje = error instanceof Error ? error.message : ''

  if (mensaje.includes('Falta el CUIT del acreedor') || mensaje.includes('financiera.acreedor.cuit es obligatorio')) {
    return 'Falta seleccionar una financiera con CUIT válido — revisá el paso 3 (Financiera).'
  }
  if (mensaje.includes('financiera.acreedor.cuit debe tener 11 dígitos')) {
    return 'El CUIT de la financiera no es válido — revisá el paso 3 (Financiera).'
  }
  if (mensaje.includes('titular.cuitDni es obligatorio')) {
    return 'Falta el CUIT/DNI de un titular — revisá el paso 1 (Titular/es).'
  }
  if (mensaje.includes('requiere un usuario autenticado')) {
    return 'Tu sesión expiró — volvé a iniciar sesión e intentá de nuevo.'
  }
  if (mensaje.includes('no existe, no pertenece a este usuario, o ya está dado de baja')) {
    return 'Este trámite ya no está disponible para editar (fue eliminado o pertenece a otra cuenta).'
  }

  return 'No se pudo guardar el trámite, intentá de nuevo.'
}

// Listado para /tramites, vía vista_tramites_resumen (scripts/referencias/
// vista_tramites_resumen.sql). Sin paginación todavía — se agrega cuando haya
// volumen real que lo justifique. Mismo contrato que el resto de los
// services de listado (listarImpresoras, listarMarcasVehiculo): nunca
// rechaza, devuelve [] si falla.
export async function listarTramites(): Promise<TramiteResumen[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('vista_tramites_resumen')
      .select('*')
      .order('fecha_creacion', { ascending: false })

    if (error) throw error
    return data ?? []
  } catch (err) {
    const error = err as Error
    console.error('Error al listar trámites:', error.message)
    return []
  }
}

// Baja en cascada (tramite, especificacion_vehiculo, contrato,
// tasas_penalidades_seguros, prenda, tramite_titular) vía el RPC
// dar_baja_tramite_completo (scripts/referencias/dar_baja_tramite_completo.sql)
// — persona/domicilio no se tocan, son compartidas. Mismo patrón de manejo
// de errores que guardarTramite: nunca falla en silencio, re-lanza.
export async function eliminarTramite(idTramite: string): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase.rpc('dar_baja_tramite_completo', { id_tramite: idTramite })

    if (error) throw error
  } catch (err) {
    const error = err as Error
    console.error('Error al eliminar el trámite:', error.message)
    throw error
  }
}

// Detalle completo para reabrir un trámite en el wizard de edición, vía
// vista_tramite_detalle (scripts/referencias/vista_tramite_detalle.sql).
// null si no existe, no pertenece a este usuario, o está dado de baja — la
// vista ya filtra eso por RLS (security_invoker) + WHERE fecha_baja IS NULL,
// así que maybeSingle() simplemente no encuentra fila, sin error.
export async function obtenerTramiteParaEditar(idTramite: string): Promise<TramiteDetalle | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('vista_tramite_detalle')
      .select('*')
      .eq('id', idTramite)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (err) {
    const error = err as Error
    console.error('Error al obtener el trámite para editar:', error.message)
    return null
  }
}

// Reconstruye el payload del wizard { titulares, vehiculo, financiera,
// contrato } a partir de TramiteDetalle. Tira Error (no devuelve null ni
// adivina) si no puede identificar la financiera del acreedor — mejor un
// mensaje claro que cargar una financiera equivocada en silencio.
export function mapTramiteDetalleAWizard(
  detalle: TramiteDetalle
): Pick<PrendaWizardPayload, 'titulares' | 'vehiculo' | 'financiera' | 'contrato'> {
  // idFinanciera es un slug hardcodeado en financieraService.ts, no un
  // persona.id — la única forma de identificar de qué financiera se trata
  // es matchear por CUIT (comparando solo dígitos, por si el formato con
  // guiones difiere en algún borde).
  const financieraEncontrada = listarFinancieras().find(
    (opcion) =>
      (opcion.acreedor.cuit ?? '').replace(/\D/g, '') === (detalle.acreedor_cuit ?? '').replace(/\D/g, '')
  )

  if (!financieraEncontrada) {
    throw new Error('No se pudo identificar la financiera de este trámite, contactá soporte')
  }

  const titulares: TitularWizard[] = (detalle.titulares ?? []).map((titular) => ({
    id: crypto.randomUUID(),
    // Paso1Titular.tsx guarda cuitDni como dígitos puros, sin guiones (el
    // onChange le hace .replace(/\D/g, '') a todo lo que se tipea) — acá
    // reconstruimos ese mismo formato a partir de cuit/dni ya separados.
    cuitDni: titular.cuit ? titular.cuit.replace(/\D/g, '') : (titular.dni ?? ''),
    nombre: titular.nombre ?? '',
    apellido: titular.apellido ?? '',
    nacionalidad: titular.nacionalidad ?? '',
    fechaNacimiento: titular.fecha_nacimiento ?? '',
    estadoCivil: (titular.estado_civil as EstadoCivilWizard) || '',
    conyuge: '',
    telefono: titular.telefono ?? '',
    email: titular.mail ?? '',
    calle: titular.calle ?? '',
    numero: titular.numero ?? '',
    localidad: titular.localidad ?? '',
    provincia: titular.provincia ?? '',
    profesion: titular.profesion ?? '',
    porcentaje: titular.porcentaje,
    actuaMedianteApoderado: false,
    apoderado: undefined,
  }))

  const vehiculo: VehiculoWizard = {
    marca: detalle.marca ?? '',
    tipo: detalle.tipo ?? '',
    modelo: detalle.modelo ?? '',
    // marcaMotor/marcaChasis: si id_marca_chasis/id_marca_motor quedaron en
    // null al guardar (texto libre sin match contra marca_vehiculo), el
    // texto original que tipeó el gestor está perdido — no hay forma de
    // recuperarlo. Fallback a la marca del vehículo, mismo criterio que
    // Paso2Vehiculo.tsx usa como autocompletado por default al elegir marca.
    marcaMotor: detalle.marca_motor ?? detalle.marca ?? '',
    numeroMotor: detalle.numero_motor ?? '',
    marcaChasis: detalle.marca_chasis ?? detalle.marca ?? '',
    numeroChasis: detalle.numero_chasis ?? '',
    // condicion no se persiste — se deriva de patente: si había patente
    // cargada, el vehículo ya estaba patentado (usado); sin patente, 0km.
    condicion: detalle.patente ? 'usado' : '0km',
    uso: (detalle.uso as UsoVehiculo) || '',
    patente: detalle.patente ?? '',
    color: detalle.color ?? '',
  }

  const financiera: FinancieraWizard = {
    idFinanciera: financieraEncontrada.id,
    nombreFinanciera: financieraEncontrada.nombre,
    tipoPrenda: financieraEncontrada.tipoPrenda,
    acreedor: financieraEncontrada.acreedor,
  }

  const contrato: ContratoWizard = {
    monto: detalle.contrato_monto != null ? String(detalle.contrato_monto) : '',
    cantidadCuotas: detalle.contrato_cantidad_cuotas != null ? String(detalle.contrato_cantidad_cuotas) : '',
    importeCuota: detalle.contrato_importe_cuota != null ? String(detalle.contrato_importe_cuota) : '',
    fechaPrimeraCuota: detalle.contrato_vencimiento_primer_cuota ?? '',
    lugarCelebracion: detalle.contrato_lugar ?? '',
    // lugarPago nunca se persiste (es un default fijo, no un dato real por
    // trámite) — vuelve a su valor inicial del wizard, no hay nada que
    // reconstruir acá.
    lugarPago: 'Domicilio del Acreedor',
    // tasaMoraAnual (tasas_penalidades_seguros.pun/pen) nunca se persiste —
    // queda vacío, consistente con que nunca se guardó este dato.
    tasaMoraAnual: '',
    tea: detalle.tasas_tea != null ? String(detalle.tasas_tea) : '',
    clase: (detalle.contrato_clase as ClasePrenda) || 'fija',
    moneda: (detalle.contrato_moneda as Moneda) || 'pesos',
    cotizacionBna: '',
    seguro: { enTramite: true, compania: '', poliza: '' },
    privilegiosPreexistentes: 'ninguno',
    privilegiosTexto: '',
    // concepto no se persiste (vive en formulario_03.concepto, tabla no
    // incluida en vista_tramite_detalle) — queda vacío a propósito, para
    // forzar que el gestor lo reconfirme: decide si corresponde asentimiento
    // conyugal (ver requiereAsentimientoConyugal en prendaService.ts).
    concepto: '',
  }

  return { titulares, vehiculo, financiera, contrato }
}
