'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface EstadoLogin {
  error: string | null
}

export async function login(_estadoPrevio: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { error: 'Email o contraseña incorrectos' }
    }
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al iniciar sesión'
    return { error: mensaje }
  }

  redirect('/dashboard')
}
