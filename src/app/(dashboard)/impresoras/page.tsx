'use client'

import { useEffect, useState } from 'react'
import {
  actualizarImpresora,
  crearImpresora,
  eliminarImpresora,
  listarImpresoras,
} from '@/lib/services/impresoraService'
import type { Impresora } from '@/types'

// Sin estilos.ts compartido fuera del wizard de prendas todavía — se
// replican acá los mismos valores que src/app/(dashboard)/prendas/nueva/estilos.ts
// para no acoplar esta página a esa carpeta.
const claseCard = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'
const claseLabel = 'mb-1 block text-sm font-medium text-gray-700'
const claseError = 'mt-1 text-xs text-red-600'
function claseInput(invalido: boolean): string {
  return [
    'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/40 focus:border-[#1B4F8A]',
    invalido ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
  ].join(' ')
}

function formatearFecha(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR')
}

export default function ImpresorasPage() {
  const [impresoras, setImpresoras] = useState<Impresora[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [mostrarFormNueva, setMostrarFormNueva] = useState(false)
  const [nombreNueva, setNombreNueva] = useState('')
  const [errorNombreNueva, setErrorNombreNueva] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)

  const [idEnEdicion, setIdEnEdicion] = useState<string | null>(null)
  const [nombreEdicion, setNombreEdicion] = useState('')
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  const [idAConfirmarBaja, setIdAConfirmarBaja] = useState<string | null>(null)
  const [dandoBajaId, setDandoBajaId] = useState<string | null>(null)

  useEffect(() => {
    cargar()
  }, [])

  // listarImpresoras() ya atrapa sus propios errores (mismo contrato que el
  // resto de los services de listado, ver vehiculoService.ts) y devuelve []
  // tanto si no hay impresoras como si falló la query — no hay try/catch acá
  // porque nunca rechaza. Una lista vacía por error real es indistinguible
  // del estado "todavía no cargaste ninguna", igual que en el resto del
  // proyecto.
  async function cargar() {
    setCargando(true)
    const resultado = await listarImpresoras()
    setImpresoras(resultado)
    setCargando(false)
  }

  async function manejarCrear() {
    if (!nombreNueva.trim()) {
      setErrorNombreNueva('Ingresá un nombre')
      return
    }
    setCreando(true)
    setError(null)
    try {
      const nueva = await crearImpresora(nombreNueva.trim())
      if (!nueva) {
        setError('No se pudo crear la impresora')
        return
      }
      setImpresoras((actual) => [...actual, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNombreNueva('')
      setErrorNombreNueva(null)
      setMostrarFormNueva(false)
    } finally {
      setCreando(false)
    }
  }

  function iniciarEdicion(impresora: Impresora) {
    setIdEnEdicion(impresora.id)
    setNombreEdicion(impresora.nombre)
    setErrorEdicion(null)
  }

  function cancelarEdicion() {
    setIdEnEdicion(null)
    setNombreEdicion('')
    setErrorEdicion(null)
  }

  async function manejarGuardarEdicion(id: string) {
    if (!nombreEdicion.trim()) {
      setErrorEdicion('Ingresá un nombre')
      return
    }
    setGuardandoEdicion(true)
    setError(null)
    try {
      const actualizada = await actualizarImpresora(id, nombreEdicion.trim())
      if (!actualizada) {
        setError('No se pudo actualizar la impresora')
        return
      }
      setImpresoras((actual) =>
        actual
          .map((impresora) => (impresora.id === id ? actualizada : impresora))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      )
      cancelarEdicion()
    } finally {
      setGuardandoEdicion(false)
    }
  }

  async function manejarConfirmarBaja(id: string) {
    setDandoBajaId(id)
    setError(null)
    try {
      const exito = await eliminarImpresora(id)
      if (!exito) {
        setError('No se pudo eliminar la impresora')
        return
      }
      setImpresoras((actual) => actual.filter((impresora) => impresora.id !== id))
    } finally {
      setDandoBajaId(null)
      setIdAConfirmarBaja(null)
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Impresoras</h1>
        {!mostrarFormNueva && (
          <button
            type="button"
            onClick={() => setMostrarFormNueva(true)}
            className="rounded-lg bg-[#1B4F8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#163f6e]"
          >
            Nueva impresora
          </button>
        )}
      </div>

      {mostrarFormNueva && (
        <div className={claseCard}>
          <span className={claseLabel}>Nombre</span>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <input
                type="text"
                autoFocus
                value={nombreNueva}
                onChange={(e) => {
                  setNombreNueva(e.target.value)
                  setErrorNombreNueva(null)
                }}
                placeholder="Ej. HP LaserJet oficina"
                className={claseInput(!!errorNombreNueva)}
              />
              {errorNombreNueva && <p className={claseError}>{errorNombreNueva}</p>}
            </div>
            <button
              type="button"
              onClick={manejarCrear}
              disabled={creando}
              className="rounded-lg bg-[#1B4F8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#163f6e] disabled:opacity-50"
            >
              {creando ? 'Creando…' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarFormNueva(false)
                setNombreNueva('')
                setErrorNombreNueva(null)
              }}
              disabled={creando}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className={claseError}>{error}</p>}

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : impresoras.length === 0 ? (
        <div className={claseCard}>
          <p className="text-sm text-gray-500">Todavía no cargaste ninguna impresora.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {impresoras.map((impresora) => (
            <div key={impresora.id} className={`${claseCard} flex items-center justify-between gap-4`}>
              {idEnEdicion === impresora.id ? (
                <div className="flex flex-1 items-start gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      autoFocus
                      value={nombreEdicion}
                      onChange={(e) => {
                        setNombreEdicion(e.target.value)
                        setErrorEdicion(null)
                      }}
                      className={claseInput(!!errorEdicion)}
                    />
                    {errorEdicion && <p className={claseError}>{errorEdicion}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => manejarGuardarEdicion(impresora.id)}
                    disabled={guardandoEdicion}
                    className="whitespace-nowrap rounded-lg bg-[#1B4F8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#163f6e] disabled:opacity-50"
                  >
                    {guardandoEdicion ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    disabled={guardandoEdicion}
                    className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{impresora.nombre}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Creada el {formatearFecha(impresora.fecha_creacion)}
                    </p>
                  </div>

                  {idAConfirmarBaja === impresora.id ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">¿Eliminar "{impresora.nombre}"?</span>
                      <button
                        type="button"
                        onClick={() => manejarConfirmarBaja(impresora.id)}
                        disabled={dandoBajaId === impresora.id}
                        className="whitespace-nowrap rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {dandoBajaId === impresora.id ? 'Eliminando…' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdAConfirmarBaja(null)}
                        disabled={dandoBajaId === impresora.id}
                        className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(impresora)}
                        className="whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdAConfirmarBaja(impresora.id)}
                        className="whitespace-nowrap rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
