import { createClient } from '@/lib/supabase/client'

export interface ContactoUsuario {
  telefono?: string
  email?: string
}

// Datos de contacto del gestor logueado, usados como default editable en el
// teléfono/email del titular (Paso 1 del wizard de prendas): los documentos
// suelen llegar al contacto del gestor, no del titular real, y tipearlos a
// mano en cada trámite es trabajo repetido innecesario. No hay tabla de
// perfil de usuario separada todavía — el teléfono se guarda en
// user_metadata de Supabase Auth (mismo lugar que "nombre", ver
// src/app/(dashboard)/dashboard/page.tsx).
export async function obtenerContactoUsuarioActual(): Promise<ContactoUsuario> {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) throw error ?? new Error('No hay usuario autenticado')

    const telefono = (user.user_metadata?.telefono as string | undefined) ?? user.phone ?? undefined

    return { email: user.email ?? undefined, telefono }
  } catch (err) {
    const error = err as Error
    console.error('Error al obtener el contacto del usuario logueado:', error.message)
    return {}
  }
}
