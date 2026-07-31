import { createClient } from '@/lib/supabase/client'
import type { CampoOverride } from '@/types'
import type { OffsetCampo } from '@/lib/pdf/offsetsImpresion'

export type { OffsetCampo }

// Defaults guardados para esta impresora+formulario, indexados por campo_id
// (CampoPDF.id) — para precargar el editor de ajuste de impresión al entrar
// al paso del wizard.
export async function listarOverrides(
  idImpresora: string,
  formulario: string
): Promise<Record<string, OffsetCampo>> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('campo_override')
      .select('campo_id, offset_x, offset_y')
      .eq('id_impresora', idImpresora)
      .eq('formulario', formulario)
      .is('fecha_baja', null)

    if (error) throw error

    // numeric de Postgres viaja como string por PostgREST — convertir explícitamente.
    return Object.fromEntries(
      (data as Pick<CampoOverride, 'campo_id' | 'offset_x' | 'offset_y'>[] | null ?? []).map((fila) => [
        fila.campo_id,
        { offsetX: Number(fila.offset_x), offsetY: Number(fila.offset_y) },
      ])
    )
  } catch (err) {
    const error = err as Error
    console.error('Error al listar ajustes de impresión:', error.message)
    return {}
  }
}

// Persiste los offsets actuales como default de esta impresora+formulario
// (upsert por id_usuario+id_impresora+formulario+campo_id, ver índice único
// en scripts/referencias/campo_override.sql). Solo toca los campos recibidos
// en `offsets`; no borra overrides de campos ausentes.
export async function guardarOverrides(
  idImpresora: string,
  formulario: string,
  offsets: Record<string, OffsetCampo>
): Promise<void> {
  if (Object.keys(offsets).length === 0) return

  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay usuario autenticado')

    const filas = Object.entries(offsets).map(([campoId, offset]) => ({
      id_usuario: user.id,
      id_impresora: idImpresora,
      formulario,
      campo_id: campoId,
      offset_x: offset.offsetX,
      offset_y: offset.offsetY,
      fecha_modificacion: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('campo_override')
      .upsert(filas, { onConflict: 'id_usuario,id_impresora,formulario,campo_id' })

    if (error) throw error
  } catch (err) {
    const error = err as Error
    console.error('Error al guardar ajustes de impresión:', error.message)
    throw error
  }
}
