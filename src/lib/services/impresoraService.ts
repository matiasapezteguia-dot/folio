import { createClient } from '@/lib/supabase/client'
import type { Impresora } from '@/types'

// Necesario para el paso "ajuste-impresion": no existía service para
// impresora todavía (la tabla solo tenía tipo + stub de página /impresoras).
export async function listarImpresoras(): Promise<Impresora[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('impresora')
      .select('*')
      .is('fecha_baja', null)
      .order('nombre')

    if (error) throw error
    return data ?? []
  } catch (err) {
    const error = err as Error
    console.error('Error al listar impresoras:', error.message)
    return []
  }
}

export async function crearImpresora(nombre: string): Promise<Impresora | null> {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay usuario autenticado')

    const { data, error } = await supabase
      .from('impresora')
      .insert({ id_usuario: user.id, nombre })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    const error = err as Error
    console.error('Error al crear impresora:', error.message)
    return null
  }
}

export async function actualizarImpresora(id: string, nombre: string): Promise<Impresora | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('impresora')
      .update({ nombre, fecha_modificacion: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    const error = err as Error
    console.error('Error al actualizar impresora:', error.message)
    return null
  }
}

// Soft delete (regla del proyecto, ver CLAUDE.md): nunca DELETE físico.
export async function eliminarImpresora(id: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('impresora')
      .update({ fecha_baja: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    const error = err as Error
    console.error('Error al eliminar impresora:', error.message)
    return false
  }
}
