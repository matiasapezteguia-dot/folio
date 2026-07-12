'use client'

import { MAX_DEUDORES_SOLIDARIOS, usePrendaWizard } from '../hooks/usePrendaWizard'
import { validarDeudorSolidario, validarGarante } from '../validacion'
import { claseCard, claseError, claseInput, claseLabel } from '../estilos'
import type { EstadoCivilWizard, PrendaDeudorSolidarioWizard, TipoDocumento } from '@/types'

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

interface Paso4DeudoresGarantesProps {
  mostrarErrores: boolean
}

export default function Paso4DeudoresGarantes({ mostrarErrores }: Paso4DeudoresGarantesProps) {
  const tieneDeudoresOGarantes = usePrendaWizard((estado) => estado.tieneDeudoresOGarantes)
  const setTieneDeudoresOGarantes = usePrendaWizard((estado) => estado.setTieneDeudoresOGarantes)
  const deudoresSolidarios = usePrendaWizard((estado) => estado.deudoresSolidarios)
  const agregarDeudorSolidario = usePrendaWizard((estado) => estado.agregarDeudorSolidario)
  const quitarDeudorSolidario = usePrendaWizard((estado) => estado.quitarDeudorSolidario)
  const actualizarDeudorSolidario = usePrendaWizard((estado) => estado.actualizarDeudorSolidario)
  const garante = usePrendaWizard((estado) => estado.garante)
  const establecerGarante = usePrendaWizard((estado) => estado.establecerGarante)
  const actualizarGarante = usePrendaWizard((estado) => estado.actualizarGarante)
  const tipoPrenda = usePrendaWizard((estado) => estado.financiera.tipoPrenda)

  const esCompaniaFinanciera = tipoPrenda === 'compania_financiera'
  const etiquetaDeudor = esCompaniaFinanciera ? 'Codeudor' : 'Deudor solidario'

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={tieneDeudoresOGarantes}
          onChange={(e) => setTieneDeudoresOGarantes(e.target.checked)}
          className="h-4 w-4 accent-[#1B4F8A]"
        />
        ¿Hay deudores solidarios o garantes?
      </label>

      {tieneDeudoresOGarantes && (
        <div className="space-y-6">
          {esCompaniaFinanciera && deudoresSolidarios.length > 1 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Solo el primer codeudor se imprime correctamente por ahora — el contrato de Compañía
              Financiera todavía tiene un único slot calibrado (ApelCodeudor1 y afines). Los
              codeudores adicionales pueden salir con datos faltantes o mal ubicados en el PDF.
            </div>
          )}

          <div className="space-y-4">
            {deudoresSolidarios.map((deudor, indice) => {
              const errores = validarDeudorSolidario(deudor, tipoPrenda)
              const conError = (campo: keyof typeof errores) => mostrarErrores && Boolean(errores[campo])

              return (
                <div key={deudor.id} className={claseCard}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {etiquetaDeudor} {deudoresSolidarios.length > 1 ? indice + 1 : ''}
                    </h3>
                    <button
                      type="button"
                      onClick={() => quitarDeudorSolidario(deudor.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={claseLabel}>Apellido</label>
                      <input
                        type="text"
                        value={deudor.apellido}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { apellido: e.target.value })}
                        className={claseInput(conError('apellido'))}
                      />
                      {conError('apellido') && <p className={claseError}>{errores.apellido}</p>}
                    </div>

                    <div>
                      <label className={claseLabel}>Nombre</label>
                      <input
                        type="text"
                        value={deudor.nombre}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { nombre: e.target.value })}
                        className={claseInput(conError('nombre'))}
                      />
                      {conError('nombre') && <p className={claseError}>{errores.nombre}</p>}
                    </div>

                    <div>
                      <label className={claseLabel}>Estado civil</label>
                      <select
                        value={deudor.estadoCivil}
                        onChange={(e) =>
                          actualizarDeudorSolidario(deudor.id, {
                            estadoCivil: e.target.value as PrendaDeudorSolidarioWizard['estadoCivil'],
                          })
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
                        value={deudor.profesion}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { profesion: e.target.value })}
                        className={claseInput(conError('profesion'))}
                      />
                      {conError('profesion') && <p className={claseError}>{errores.profesion}</p>}
                    </div>

                    <div>
                      <label className={claseLabel}>Nacionalidad</label>
                      <input
                        type="text"
                        value={deudor.nacionalidad}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { nacionalidad: e.target.value })}
                        className={claseInput(conError('nacionalidad'))}
                      />
                      {conError('nacionalidad') && <p className={claseError}>{errores.nacionalidad}</p>}
                    </div>

                    {esCompaniaFinanciera ? (
                      <div>
                        <label className={claseLabel}>Fecha de nacimiento</label>
                        <input
                          type="date"
                          value={deudor.fechaNacimiento}
                          onChange={(e) =>
                            actualizarDeudorSolidario(deudor.id, { fechaNacimiento: e.target.value })
                          }
                          className={claseInput(conError('fechaNacimiento'))}
                        />
                        {conError('fechaNacimiento') && (
                          <p className={claseError}>{errores.fechaNacimiento}</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className={claseLabel}>Edad</label>
                        <input
                          type="number"
                          min={0}
                          value={deudor.edad}
                          onChange={(e) => actualizarDeudorSolidario(deudor.id, { edad: e.target.value })}
                          className={claseInput(conError('edad'))}
                        />
                        {conError('edad') && <p className={claseError}>{errores.edad}</p>}
                      </div>
                    )}

                    <div>
                      <label className={claseLabel}>Tipo de documento</label>
                      <select
                        value={deudor.tipoDocumento}
                        onChange={(e) =>
                          actualizarDeudorSolidario(deudor.id, {
                            tipoDocumento: e.target.value as PrendaDeudorSolidarioWizard['tipoDocumento'],
                          })
                        }
                        className={claseInput(conError('tipoDocumento'))}
                      >
                        <option value="">Seleccioná una opción</option>
                        {OPCIONES_TIPO_DOCUMENTO.map((opcion) => (
                          <option key={opcion.valor} value={opcion.valor}>
                            {opcion.etiqueta}
                          </option>
                        ))}
                      </select>
                      {conError('tipoDocumento') && <p className={claseError}>{errores.tipoDocumento}</p>}
                    </div>

                    <div>
                      <label className={claseLabel}>Número de documento</label>
                      <input
                        type="text"
                        value={deudor.numeroDocumento}
                        onChange={(e) =>
                          actualizarDeudorSolidario(deudor.id, { numeroDocumento: e.target.value })
                        }
                        className={claseInput(conError('numeroDocumento'))}
                      />
                      {conError('numeroDocumento') && (
                        <p className={claseError}>{errores.numeroDocumento}</p>
                      )}
                    </div>

                    <div>
                      <label className={claseLabel}>Calle</label>
                      <input
                        type="text"
                        value={deudor.calle}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { calle: e.target.value })}
                        className={claseInput(conError('calle'))}
                      />
                      {conError('calle') && <p className={claseError}>{errores.calle}</p>}
                    </div>

                    <div>
                      <label className={claseLabel}>Número</label>
                      <input
                        type="text"
                        value={deudor.numero}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { numero: e.target.value })}
                        className={claseInput(conError('numero'))}
                      />
                      {conError('numero') && <p className={claseError}>{errores.numero}</p>}
                    </div>

                    <div>
                      <label className={claseLabel}>Piso</label>
                      <input
                        type="text"
                        value={deudor.piso}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { piso: e.target.value })}
                        className={claseInput(false)}
                      />
                    </div>

                    <div>
                      <label className={claseLabel}>Depto</label>
                      <input
                        type="text"
                        value={deudor.depto}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { depto: e.target.value })}
                        className={claseInput(false)}
                      />
                    </div>

                    <div>
                      <label className={claseLabel}>Localidad</label>
                      <input
                        type="text"
                        value={deudor.localidad}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { localidad: e.target.value })}
                        className={claseInput(conError('localidad'))}
                      />
                      {conError('localidad') && <p className={claseError}>{errores.localidad}</p>}
                    </div>

                    <div>
                      <label className={claseLabel}>Código postal</label>
                      <input
                        type="text"
                        value={deudor.cp}
                        onChange={(e) => actualizarDeudorSolidario(deudor.id, { cp: e.target.value })}
                        className={claseInput(conError('cp'))}
                      />
                      {conError('cp') && <p className={claseError}>{errores.cp}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {(esCompaniaFinanciera || deudoresSolidarios.length < MAX_DEUDORES_SOLIDARIOS) && (
            <button
              type="button"
              onClick={agregarDeudorSolidario}
              className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-[#1B4F8A] hover:text-[#1B4F8A]"
            >
              + Agregar {etiquetaDeudor.toLowerCase()}
            </button>
          )}

          {!esCompaniaFinanciera && (
            <div className={claseCard}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={garante !== undefined}
                  onChange={(e) =>
                    establecerGarante(e.target.checked ? { nombre: '', dni: '', domicilio: '' } : undefined)
                  }
                  className="h-4 w-4 accent-[#1B4F8A]"
                />
                ¿Hay garante?
              </label>

              {garante && (
                <GaranteForm
                  garante={garante}
                  mostrarErrores={mostrarErrores}
                  onCambiar={actualizarGarante}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface GaranteFormProps {
  garante: { nombre: string; dni: string; domicilio: string }
  mostrarErrores: boolean
  onCambiar: (cambios: Partial<{ nombre: string; dni: string; domicilio: string }>) => void
}

function GaranteForm({ garante, mostrarErrores, onCambiar }: GaranteFormProps) {
  const errores = validarGarante(garante)
  const conError = (campo: keyof typeof errores) => mostrarErrores && Boolean(errores[campo])

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={claseLabel}>Nombre y apellido</label>
        <input
          type="text"
          value={garante.nombre}
          onChange={(e) => onCambiar({ nombre: e.target.value })}
          className={claseInput(conError('nombre'))}
        />
        {conError('nombre') && <p className={claseError}>{errores.nombre}</p>}
      </div>

      <div>
        <label className={claseLabel}>DNI</label>
        <input
          type="text"
          value={garante.dni}
          onChange={(e) => onCambiar({ dni: e.target.value })}
          className={claseInput(conError('dni'))}
        />
        {conError('dni') && <p className={claseError}>{errores.dni}</p>}
      </div>

      <div>
        <label className={claseLabel}>Domicilio</label>
        <input
          type="text"
          value={garante.domicilio}
          onChange={(e) => onCambiar({ domicilio: e.target.value })}
          className={claseInput(conError('domicilio'))}
        />
        {conError('domicilio') && <p className={claseError}>{errores.domicilio}</p>}
      </div>
    </div>
  )
}
