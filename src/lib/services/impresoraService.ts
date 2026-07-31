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
