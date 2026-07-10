'use client'

import { useActionState } from 'react'
import { login, type EstadoLogin } from './actions'

const estadoInicial: EstadoLogin = { error: null }

export default function LoginPage() {
  const [estado, formAction, isPending] = useActionState(login, estadoInicial)

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-4">
      <form action={formAction} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <h1 className="text-lg font-semibold">Ingresar a Folio</h1>

        {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
