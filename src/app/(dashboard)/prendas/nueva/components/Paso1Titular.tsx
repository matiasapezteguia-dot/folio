'use client'

import { useEffect, useState } from 'react'
import { usePrendaWizard, crearApoderadoVacio } from '../hooks/usePrendaWizard'
import { validarTitular, type ErroresApoderado } from '../validacion'
import { buscarPersonaPorCuitDni } from '@/lib/services/afipService'
import { listarApoderadosPorPersona, type ApoderadoGuardado } from '@/lib/services/apoderadoService'
import { obtenerContactoUsuarioActual, type ContactoUsuario } from '@/lib/services/usuarioService'
import { claseCard, claseError, claseInput, claseLabel } from '../estilos'
import type { EstadoCivilWizard, TipoDocumento, TipoPoder } from '@/types'

const OPCIONES_ESTADO_CIVIL: { valor: EstadoCivilWizard; etiqueta: string }[] = [
  { valor: 'soltero', etiqueta: 'Soltero/a' },
  { valor: 'casado', etiqueta: 'Casado/a' },
  { valor: 'viudo', etiqueta: 'Viudo/a' },
  { valor: 'divorciado', etiqueta: 'Divorciado/a' },
]

const OPCIONES_TIPO_DOCUMENTO: { valor: TipoDocumento; etiqueta: string }[] = [
  { valor: 'DNI', etiqueta: 'DNI' },
  { valor: 'LE', etiqueta: 'LE' },
  { valor: 'LC', etiqueta: 'LC' },
  { valor: 'PASAPORTE', etiqueta: 'Pasaporte' },
]

const OPCIONES_TIPO_PODER: { valor: TipoPoder; etiqueta: string }[] = [
  { valor: 'escritura_publica', etiqueta: 'Escritura pública' },
  { valor: 'carta_poder', etiqueta: 'Carta poder' },
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
  const [apoderadosSugeridos, setApoderadosSugeridos] = useState<Record<string, ApoderadoGuardado[]>>({})
  const [contactoUsuario, setContactoUsuario] = useState<ContactoUsuario | null>(null)

  const sumaPorcentajes = titulares.reduce((acumulado, titular) => acumulado + titular.porcentaje, 0)
  const mostrarPorcentajes = titulares.length >= 2

  useEffect(() => {
    obtenerContactoUsuarioActual().then(setContactoUsuario)
  }, [])

  // Precarga teléfono/email del gestor logueado como default editable: los
  // documentos suelen llegar a su contacto, no al del titular real, y
  // tipearlo a mano en cada trámite es trabajo repetido innecesario. Corre
  // al montar y cada vez que se agrega un titular nuevo, y solo completa el
  // último titular si sus campos siguen vacíos (no pisa lo que el gestor ya
  // haya tipeado o borrado a propósito).
  useEffect(() => {
    if (!contactoUsuario) return
    const ultimo = titulares[titulares.length - 1]
    if (!ultimo) return

    const cambios: { telefono?: string; email?: string } = {}
    if (!ultimo.telefono && contactoUsuario.telefono) cambios.telefono = contactoUsuario.telefono
    if (!ultimo.email && contactoUsuario.email) cambios.email = contactoUsuario.email
    if (Object.keys(cambios).length > 0) actualizarTitular(ultimo.id, cambios)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulares.length, contactoUsuario])

  async function buscarApoderadosSugeridos(id: string, cuitDni: string) {
    if (!cuitDni.trim() || apoderadosSugeridos[id]) return
    const apoderados = await listarApoderadosPorPersona(cuitDni)
    setApoderadosSugeridos((previo) => ({ ...previo, [id]: apoderados }))
  }

  async function manejarBusquedaAfip(id: string, cuitDni: string) {
    if (!cuitDni.trim()) return
    setBuscandoId(id)
    try {
      const [persona, apoderados] = await Promise.all([
        buscarPersonaPorCuitDni(cuitDni),
        listarApoderadosPorPersona(cuitDni),
      ])
      if (persona) actualizarTitular(id, persona)
      setApoderadosSugeridos((previo) => ({ ...previo, [id]: apoderados }))
    } finally {
      setBuscandoId(null)
    }
  }

  function manejarToggleApoderado(id: string, cuitDni: string, apoderadoActual: ApoderadoGuardado | undefined, activo: boolean) {
    actualizarTitular(id, {
      actuaMedianteApoderado: activo,
      apoderado: activo ? (apoderadoActual ?? crearApoderadoVacio()) : undefined,
    })
    if (activo) buscarApoderadosSugeridos(id, cuitDni)
  }

  return (
    <div className="space-y-6">
      {titulares.map((titular, indice) => {
        const errores = validarTitular(titular)
        const conError = (campo: keyof typeof errores) => mostrarErrores && Boolean(errores[campo])
        const conErrorApoderado = (campo: keyof ErroresApoderado) =>
          mostrarErrores && Boolean(errores.apoderado?.[campo])
        const sugeridos = apoderadosSugeridos[titular.id] ?? []

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
                    inputMode="numeric"
                    value={titular.cuitDni}
                    onChange={(e) =>
                      actualizarTitular(titular.id, { cuitDni: e.target.value.replace(/\D/g, '') })
                    }
                    className={claseInput(conError('cuitDni'))}
                    placeholder="20123456789"
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
                <label className={claseLabel}>Fecha de nacimiento</label>
                <input
                  type="date"
                  value={titular.fechaNacimiento}
                  onChange={(e) => actualizarTitular(titular.id, { fechaNacimiento: e.target.value })}
                  className={claseInput(conError('fechaNacimiento'))}
                />
                {conError('fechaNacimiento') && <p className={claseError}>{errores.fechaNacimiento}</p>}
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

            <div className="mt-4 border-t border-gray-100 pt-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={titular.actuaMedianteApoderado}
                  onChange={(e) =>
                    manejarToggleApoderado(titular.id, titular.cuitDni, titular.apoderado, e.target.checked)
                  }
                  className="h-4 w-4 accent-[#1B4F8A]"
                />
                Actúa mediante apoderado
              </label>

              {!titular.actuaMedianteApoderado && sugeridos.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Este titular tiene {sugeridos.length} apoderado{sugeridos.length > 1 ? 's' : ''} cargado
                  {sugeridos.length > 1 ? 's' : ''} anteriormente.
                </p>
              )}

              {titular.actuaMedianteApoderado && (
                <div className="mt-4 space-y-4">
                  {sugeridos.length > 0 && (
                    <div>
                      <p className={claseLabel}>Apoderados ya cargados</p>
                      <div className="flex flex-wrap gap-2">
                        {sugeridos.map((sugerido) => (
                          <button
                            key={sugerido.id}
                            type="button"
                            onClick={() => actualizarTitular(titular.id, { apoderado: sugerido })}
                            className={[
                              'rounded-lg border px-3 py-2 text-left text-xs',
                              titular.apoderado?.id === sugerido.id
                                ? 'border-[#1B4F8A] bg-[#1B4F8A]/5'
                                : 'border-gray-300 hover:border-[#1B4F8A]',
                            ].join(' ')}
                          >
                            <span className="block font-medium text-gray-900">{sugerido.nombreApellido}</span>
                            <span className="text-gray-500">
                              {sugerido.tipoDocumento} {sugerido.numeroDocumento}
                            </span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => actualizarTitular(titular.id, { apoderado: crearApoderadoVacio() })}
                          className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:border-[#1B4F8A] hover:text-[#1B4F8A]"
                        >
                          + Cargar apoderado nuevo
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={claseLabel}>Nombre y apellido del apoderado</label>
                      <input
                        type="text"
                        value={titular.apoderado?.nombreApellido ?? ''}
                        onChange={(e) =>
                          actualizarTitular(titular.id, {
                            apoderado: {
                              ...(titular.apoderado ?? crearApoderadoVacio()),
                              nombreApellido: e.target.value,
                            },
                          })
                        }
                        className={claseInput(conErrorApoderado('nombreApellido'))}
                      />
                      {conErrorApoderado('nombreApellido') && (
                        <p className={claseError}>{errores.apoderado?.nombreApellido}</p>
                      )}
                    </div>

                    <div>
                      <label className={claseLabel}>Tipo de documento</label>
                      <select
                        value={titular.apoderado?.tipoDocumento ?? ''}
                        onChange={(e) =>
                          actualizarTitular(titular.id, {
                            apoderado: {
                              ...(titular.apoderado ?? crearApoderadoVacio()),
                              tipoDocumento: e.target.value as TipoDocumento | '',
                            },
                          })
                        }
                        className={claseInput(conErrorApoderado('tipoDocumento'))}
                      >
                        <option value="">Seleccioná una opción</option>
                        {OPCIONES_TIPO_DOCUMENTO.map((opcion) => (
                          <option key={opcion.valor} value={opcion.valor}>
                            {opcion.etiqueta}
                          </option>
                        ))}
                      </select>
                      {conErrorApoderado('tipoDocumento') && (
                        <p className={claseError}>{errores.apoderado?.tipoDocumento}</p>
                      )}
                    </div>

                    <div>
                      <label className={claseLabel}>Número de documento</label>
                      <input
                        type="text"
                        value={titular.apoderado?.numeroDocumento ?? ''}
                        onChange={(e) =>
                          actualizarTitular(titular.id, {
                            apoderado: {
                              ...(titular.apoderado ?? crearApoderadoVacio()),
                              numeroDocumento: e.target.value,
                            },
                          })
                        }
                        className={claseInput(conErrorApoderado('numeroDocumento'))}
                      />
                      {conErrorApoderado('numeroDocumento') && (
                        <p className={claseError}>{errores.apoderado?.numeroDocumento}</p>
                      )}
                    </div>

                    <div>
                      <label className={claseLabel}>Tipo de poder</label>
                      <select
                        value={titular.apoderado?.tipoPoder ?? ''}
                        onChange={(e) =>
                          actualizarTitular(titular.id, {
                            apoderado: {
                              ...(titular.apoderado ?? crearApoderadoVacio()),
                              tipoPoder: e.target.value as TipoPoder | '',
                            },
                          })
                        }
                        className={claseInput(conErrorApoderado('tipoPoder'))}
                      >
                        <option value="">Seleccioná una opción</option>
                        {OPCIONES_TIPO_PODER.map((opcion) => (
                          <option key={opcion.valor} value={opcion.valor}>
                            {opcion.etiqueta}
                          </option>
                        ))}
                      </select>
                      {conErrorApoderado('tipoPoder') && (
                        <p className={claseError}>{errores.apoderado?.tipoPoder}</p>
                      )}
                    </div>

                    <div>
                      <label className={claseLabel}>Datos del poder (número/fecha)</label>
                      <input
                        type="text"
                        value={titular.apoderado?.datosPoder ?? ''}
                        onChange={(e) =>
                          actualizarTitular(titular.id, {
                            apoderado: {
                              ...(titular.apoderado ?? crearApoderadoVacio()),
                              datosPoder: e.target.value,
                            },
                          })
                        }
                        className={claseInput(false)}
                      />
                    </div>
                  </div>
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
