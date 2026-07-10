'use client'

import { useState } from 'react'
import { usePrendaWizard } from '../hooks/usePrendaWizard'
import { validarTitular } from '../validacion'
import { buscarPersonaPorCuitDni } from '@/lib/services/afipService'
import { claseCard, claseError, claseInput, claseLabel } from '../estilos'
import type { EstadoCivilWizard } from '@/types'

const OPCIONES_ESTADO_CIVIL: { valor: EstadoCivilWizard; etiqueta: string }[] = [
  { valor: 'soltero', etiqueta: 'Soltero/a' },
  { valor: 'casado', etiqueta: 'Casado/a' },
  { valor: 'viudo', etiqueta: 'Viudo/a' },
  { valor: 'divorciado', etiqueta: 'Divorciado/a' },
]

const MAX_TITULARES = 4

interface Paso1TitularProps {
  mostrarErrores: boolean
}

export default function Paso1Titular({ mostrarErrores }: Paso1TitularProps) {
  const titulares = usePrendaWizard((estado) => estado.titulares)
  const agregarTitular = usePrendaWizard((estado) => estado.agregarTitular)
  const quitarTitular = usePrendaWizard((estado) => estado.quitarTitular)
  const actualizarTitular = usePrendaWizard((estado) => estado.actualizarTitular)

  const [buscandoId, setBuscandoId] = useState<string | null>(null)

  const sumaPorcentajes = titulares.reduce((acumulado, titular) => acumulado + titular.porcentaje, 0)
  const mostrarPorcentajes = titulares.length >= 2

  async function manejarBusquedaAfip(id: string, cuitDni: string) {
    if (!cuitDni.trim()) return
    setBuscandoId(id)
    try {
      const persona = await buscarPersonaPorCuitDni(cuitDni)
      if (persona) actualizarTitular(id, persona)
    } finally {
      setBuscandoId(null)
    }
  }

  return (
    <div className="space-y-6">
      {titulares.map((titular, indice) => {
        const errores = validarTitular(titular)
        const conError = (campo: keyof typeof errores) => mostrarErrores && Boolean(errores[campo])

        return (
          <div key={titular.id} className={claseCard}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                {indice === 0 ? 'Titular' : `Co-titular ${indice + 1}`}
              </h3>
              {indice > 0 && (
                <button
                  type="button"
                  onClick={() => quitarTitular(titular.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={claseLabel}>CUIT / DNI</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={titular.cuitDni}
                    onChange={(e) => actualizarTitular(titular.id, { cuitDni: e.target.value })}
                    className={claseInput(conError('cuitDni'))}
                    placeholder="20-12345678-9"
                  />
                  <button
                    type="button"
                    onClick={() => manejarBusquedaAfip(titular.id, titular.cuitDni)}
                    disabled={buscandoId === titular.id}
                    className="whitespace-nowrap rounded-lg border border-[#1B4F8A] px-4 py-2 text-sm font-medium text-[#1B4F8A] hover:bg-[#1B4F8A]/5 disabled:opacity-50"
                  >
                    {buscandoId === titular.id ? 'Buscando…' : 'Buscar'}
                  </button>
                </div>
                {conError('cuitDni') && <p className={claseError}>{errores.cuitDni}</p>}
              </div>

              <div>
                <label className={claseLabel}>Nombre</label>
                <input
                  type="text"
                  value={titular.nombre}
                  onChange={(e) => actualizarTitular(titular.id, { nombre: e.target.value })}
                  className={claseInput(conError('nombre'))}
                />
                {conError('nombre') && <p className={claseError}>{errores.nombre}</p>}
              </div>

              <div>
                <label className={claseLabel}>Apellido</label>
                <input
                  type="text"
                  value={titular.apellido}
                  onChange={(e) => actualizarTitular(titular.id, { apellido: e.target.value })}
                  className={claseInput(conError('apellido'))}
                />
                {conError('apellido') && <p className={claseError}>{errores.apellido}</p>}
              </div>

              <div>
                <label className={claseLabel}>Nacionalidad</label>
                <input
                  type="text"
                  value={titular.nacionalidad}
                  onChange={(e) => actualizarTitular(titular.id, { nacionalidad: e.target.value })}
                  className={claseInput(conError('nacionalidad'))}
                />
                {conError('nacionalidad') && <p className={claseError}>{errores.nacionalidad}</p>}
              </div>

              <div>
                <label className={claseLabel}>Edad</label>
                <input
                  type="number"
                  min={0}
                  value={titular.edad}
                  onChange={(e) => actualizarTitular(titular.id, { edad: e.target.value })}
                  className={claseInput(conError('edad'))}
                />
                {conError('edad') && <p className={claseError}>{errores.edad}</p>}
              </div>

              <div>
                <label className={claseLabel}>Estado civil</label>
                <select
                  value={titular.estadoCivil}
                  onChange={(e) =>
                    actualizarTitular(titular.id, { estadoCivil: e.target.value as EstadoCivilWizard | '' })
                  }
                  className={claseInput(conError('estadoCivil'))}
                >
                  <option value="">Seleccioná una opción</option>
                  {OPCIONES_ESTADO_CIVIL.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
                {conError('estadoCivil') && <p className={claseError}>{errores.estadoCivil}</p>}
              </div>

              {titular.estadoCivil === 'casado' && (
                <div>
                  <label className={claseLabel}>Nombre y apellido del cónyuge</label>
                  <input
                    type="text"
                    value={titular.conyuge}
                    onChange={(e) => actualizarTitular(titular.id, { conyuge: e.target.value })}
                    className={claseInput(conError('conyuge'))}
                  />
                  {conError('conyuge') && <p className={claseError}>{errores.conyuge}</p>}
                </div>
              )}

              <div>
                <label className={claseLabel}>Profesión</label>
                <input
                  type="text"
                  value={titular.profesion}
                  onChange={(e) => actualizarTitular(titular.id, { profesion: e.target.value })}
                  className={claseInput(conError('profesion'))}
                />
                {conError('profesion') && <p className={claseError}>{errores.profesion}</p>}
              </div>

              <div>
                <label className={claseLabel}>Teléfono</label>
                <input
                  type="tel"
                  value={titular.telefono}
                  onChange={(e) => actualizarTitular(titular.id, { telefono: e.target.value })}
                  className={claseInput(conError('telefono'))}
                />
                {conError('telefono') && <p className={claseError}>{errores.telefono}</p>}
              </div>

              <div>
                <label className={claseLabel}>Email</label>
                <input
                  type="email"
                  value={titular.email}
                  onChange={(e) => actualizarTitular(titular.id, { email: e.target.value })}
                  className={claseInput(conError('email'))}
                />
                {conError('email') && <p className={claseError}>{errores.email}</p>}
              </div>

              <div>
                <label className={claseLabel}>Calle</label>
                <input
                  type="text"
                  value={titular.calle}
                  onChange={(e) => actualizarTitular(titular.id, { calle: e.target.value })}
                  className={claseInput(conError('calle'))}
                />
                {conError('calle') && <p className={claseError}>{errores.calle}</p>}
              </div>

              <div>
                <label className={claseLabel}>Número</label>
                <input
                  type="text"
                  value={titular.numero}
                  onChange={(e) => actualizarTitular(titular.id, { numero: e.target.value })}
                  className={claseInput(conError('numero'))}
                />
                {conError('numero') && <p className={claseError}>{errores.numero}</p>}
              </div>

              <div>
                <label className={claseLabel}>Localidad</label>
                <input
                  type="text"
                  value={titular.localidad}
                  onChange={(e) => actualizarTitular(titular.id, { localidad: e.target.value })}
                  className={claseInput(conError('localidad'))}
                />
                {conError('localidad') && <p className={claseError}>{errores.localidad}</p>}
              </div>

              <div>
                <label className={claseLabel}>Provincia</label>
                <input
                  type="text"
                  value={titular.provincia}
                  onChange={(e) => actualizarTitular(titular.id, { provincia: e.target.value })}
                  className={claseInput(conError('provincia'))}
                />
                {conError('provincia') && <p className={claseError}>{errores.provincia}</p>}
              </div>

              {mostrarPorcentajes && (
                <div>
                  <label className={claseLabel}>% de titularidad</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={titular.porcentaje}
                    onChange={(e) =>
                      actualizarTitular(titular.id, { porcentaje: Number(e.target.value) })
                    }
                    className={claseInput(mostrarErrores && sumaPorcentajes !== 100)}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}

      {mostrarPorcentajes && (
        <p
          className={[
            'text-sm font-medium',
            sumaPorcentajes === 100 ? 'text-emerald-600' : 'text-red-600',
          ].join(' ')}
        >
          Total: {sumaPorcentajes}% {sumaPorcentajes === 100 ? '✓' : '— debe sumar 100%'}
        </p>
      )}

      {titulares.length < MAX_TITULARES && (
        <button
          type="button"
          onClick={agregarTitular}
          className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-[#1B4F8A] hover:text-[#1B4F8A]"
        >
          + Agregar co-titular
        </button>
      )}
    </div>
  )
}
