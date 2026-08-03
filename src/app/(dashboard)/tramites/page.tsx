'use client'

import { useEffect, useState } from 'react'
import { listarTramites } from '@/lib/services/tramiteService'
import type { EstadoTramite, TramiteResumen } from '@/types'

// Sin estilos.ts compartido fuera del wizard de prendas todavía — se replican
// acá los mismos valores que src/app/(dashboard)/prendas/nueva/estilos.ts,
// mismo criterio que impresoras/page.tsx.
const claseCard = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'

// Mismo patrón visual que el botón "Próximamente" de Paso5Revision.tsx
// (Anexo de Cláusulas Especiales) — reimprimir PDF es el subpaso 6, baja es
// el subpaso 4, ninguno de los dos entra en esta tarea.
const claseBotonProximamente =
  'whitespace-nowrap cursor-not-allowed rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400'

const claseBadgePorEstado: Record<EstadoTramite, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  generado: 'bg-blue-50 text-blue-700',
  impreso: 'bg-green-50 text-green-700',
  anulado: 'bg-red-50 text-red-700',
}

const etiquetaPorEstado: Record<EstadoTramite, string> = {
  borrador: 'Borrador',
  generado: 'Generado',
  impreso: 'Impreso',
  anulado: 'Anulado',
}

function formatearFecha(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR')
}

export default function TramitesPage() {
  const [tramites, setTramites] = useState<TramiteResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [idExpandido, setIdExpandido] = useState<string | null>(null)

  useEffect(() => {
    // listarTramites() ya atrapa sus propios errores y devuelve [] tanto si
    // no hay trámites como si falló la query (mismo contrato que
    // listarImpresoras) — una lista vacía por error real es indistinguible
    // del estado "todavía no guardaste ninguno", igual que en /impresoras.
    listarTramites().then((resultado) => {
      setTramites(resultado)
      setCargando(false)
    })
  }, [])

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Trámites</h1>

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : tramites.length === 0 ? (
        <div className={claseCard}>
          <p className="text-sm text-gray-500">Todavía no guardaste ningún trámite.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tramites.map((tramite) => (
            <div key={tramite.id} className={claseCard}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${claseBadgePorEstado[tramite.estado]}`}
                  >
                    {etiquetaPorEstado[tramite.estado]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {tramite.marca && tramite.modelo
                        ? `${tramite.marca} ${tramite.modelo}`
                        : 'Vehículo sin datos'}
                      {' — '}
                      {tramite.patente || 'Sin patente'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatearFecha(tramite.fecha_creacion)}
                      {tramite.titular_principal ? ` · ${tramite.titular_principal}` : ''}
                      {tramite.acreedor ? ` · ${tramite.acreedor}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIdExpandido((actual) => (actual === tramite.id ? null : tramite.id))}
                    className="whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {idExpandido === tramite.id ? 'Ocultar' : 'Ver'}
                  </button>
                  <button type="button" disabled title="En desarrollo" className={claseBotonProximamente}>
                    Reimprimir PDF
                  </button>
                  <button type="button" disabled title="En desarrollo" className={claseBotonProximamente}>
                    Eliminar
                  </button>
                </div>
              </div>

              {idExpandido === tramite.id && (
                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estado</span>
                    <span className="font-medium text-gray-900">{etiquetaPorEstado[tramite.estado]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha</span>
                    <span className="font-medium text-gray-900">{formatearFecha(tramite.fecha_creacion)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Marca</span>
                    <span className="font-medium text-gray-900">{tramite.marca || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Modelo</span>
                    <span className="font-medium text-gray-900">{tramite.modelo || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Patente</span>
                    <span className="font-medium text-gray-900">{tramite.patente || 'Sin patente'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Titular principal</span>
                    <span className="font-medium text-gray-900">{tramite.titular_principal || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Financiera</span>
                    <span className="font-medium text-gray-900">{tramite.acreedor || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
