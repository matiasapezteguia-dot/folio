import { createClient } from '@/lib/supabase/server'

export default async function InicioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const nombre = (user?.user_metadata?.nombre as string | undefined) ?? user?.email ?? ''

  return <div className="p-6">Bienvenido, {nombre}</div>
}
