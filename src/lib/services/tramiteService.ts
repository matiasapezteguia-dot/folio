import { createClient } from '@/lib/supabase/client'
import type { PrendaWizardPayload } from '@/types'

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

// Traduce los RAISE EXCEPTION conocidos de guardar_tramite_completo.sql (y el
// chequeo de acreedor.cuit de acá arriba) a un mensaje entendible para el
// gestor. El detalle técnico ya quedó en console.error de guardarTramite() —
// esto es solo para mostrar en pantalla.
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

  return 'No se pudo guardar el trámite, intentá de nuevo.'
}
