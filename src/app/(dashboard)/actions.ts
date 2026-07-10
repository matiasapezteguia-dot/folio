'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function cerrarSesion(): Promise<void> {
  const supabase = await createClient()

  try {
    await supabase.auth.signOut()
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al cerrar sesión'
    throw new Error(mensaje)
  }

  redirect('/login')
}
