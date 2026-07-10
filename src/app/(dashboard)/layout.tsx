import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cerrarSesion } from './actions'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const nombre = (user.user_metadata?.nombre as string | undefined) ?? user.email ?? ''

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-medium">{nombre}</span>
        <form action={cerrarSesion}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
