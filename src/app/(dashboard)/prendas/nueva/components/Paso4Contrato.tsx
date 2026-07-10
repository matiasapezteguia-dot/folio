'use client'

import { usePrendaWizard } from '../hooks/usePrendaWizard'
import { requiereColor } from '../validacion'
import { claseCard, claseError, claseInput, claseLabel } from '../estilos'
import { formatMoneda } from '@/lib/utils/formatMoneda'
import { numeroALetras } from '@/lib/utils/numeroALetras'
import type { ClasePrenda, Moneda } from '@/types'

const OPCIONES_CLASE: { valor: ClasePrenda; etiqueta: string }[] = [
  { valor: 'fija', etiqueta: 'Fija' },
  { valor: 'flotante', etiqueta: 'Flotante' },
]

const OPCIONES_MONEDA: { valor: Moneda; etiqueta: string }[] = [
  { valor: 'pesos', etiqueta: 'Pesos' },
  { valor: 'usd', etiqueta: 'USD' },
]

interface Paso4ContratoProps {
  mostrarErrores: boolean
}

export default function Paso4Contrato({ mostrarErrores }: Paso4ContratoProps) {
  const contrato = usePrendaWizard((estado) => estado.contrato)
  const actualizarContrato = usePrendaWizard((estado) => estado.actualizarContrato)
  const esPlanAhorro = usePrendaWizard((estado) => estado.financiera.tipoPrenda === 'plan_ahorro')
  const vehiculo = usePrendaWizard((estado) => estado.vehiculo)
  const setPaso = usePrendaWizard((estado) => estado.setPaso)

  const montoNumerico = Number(contrato.monto)
  const montoEnLetras = montoNumerico > 0 ? numeroALetras(montoNumerico) : ''
  const faltaColorVehiculo = requiereColor(vehiculo.condicion, contrato.clase) && !vehiculo.color.trim()

  const conError = (valido: boolean) => mostrarErrores && !valido

  return (
    <div className="space-y-6">
      <div className={claseCard}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className={claseLabel}>Clase</span>
            <div className="flex gap-4">
              {OPCIONES_CLASE.map((opcion) => (
                <label
                  key={opcion.valor}
                  className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm has-[:checked]:border-[#1B4F8A] has-[:checked]:bg-[#1B4F8A]/5"
                >
                  <input
                    type="radio"
                    name="clase"
                    value={opcion.valor}
                    checked={contrato.clase === opcion.valor}
                    onChange={() => actualizarContrato({ clase: opcion.valor })}
                    className="h-4 w-4 accent-[#1B4F8A]"
                  />
                  {opcion.etiqueta}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className={claseLabel}>Moneda</span>
            <div className="flex gap-4">
              {OPCIONES_MONEDA.map((opcion) => (
                <label
                  key={opcion.valor}
                  className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm has-[:checked]:border-[#1B4F8A] has-[:checked]:bg-[#1B4F8A]/5"
                >
                  <input
                    type="radio"
                    name="moneda"
                    value={opcion.valor}
                    checked={contrato.moneda === opcion.valor}
                    onChange={() => actualizarContrato({ moneda: opcion.valor })}
                    className="h-4 w-4 accent-[#1B4F8A]"
                  />
                  {opcion.etiqueta}
                </label>
              ))}
            </div>
          </div>

          {contrato.moneda === 'usd' && (
            <div className="sm:col-span-2">
              <label className={claseLabel}>Cotización BNA tipo vendedor</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={contrato.cotizacionBna}
                onChange={(e) => actualizarContrato({ cotizacionBna: e.target.value })}
                className={claseInput(conError(Boolean(contrato.cotizacionBna.trim())))}
              />
              <p className="mt-1 text-xs text-gray-500">
                Cotización del día hábil anterior a la celebración
              </p>
              {conError(Boolean(contrato.cotizacionBna.trim())) && (
                <p className={claseError}>Ingresá la cotización BNA tipo vendedor</p>
              )}
            </div>
          )}
        </div>
      </div>

      {faltaColorVehiculo && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Falta el color del vehículo, obligatorio en prenda flotante sobre 0km (DNTR).{' '}
          <button type="button" onClick={() => setPaso(2)} className="font-medium underline">
            Volver al paso 2
          </button>
        </div>
      )}

      <div className={`${claseCard} grid grid-cols-1 gap-4 sm:grid-cols-2`}>
        <div>
          <label className={claseLabel}>Monto</label>
          <input
            type="number"
            min={0}
            value={contrato.monto}
            onChange={(e) => actualizarContrato({ monto: e.target.value })}
            className={claseInput(conError(montoNumerico > 0))}
          />
          {montoNumerico > 0 && <p className="mt-1 text-xs text-gray-500">{formatMoneda(montoNumerico)}</p>}
          {conError(montoNumerico > 0) && <p className={claseError}>Ingresá el monto</p>}
        </div>

        <div>
          <label className={claseLabel}>Monto en letras</label>
          <input
            type="text"
            value={montoEnLetras}
            readOnly
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div>
          <label className={claseLabel}>Cantidad de cuotas</label>
          <input
            type="number"
            min={1}
            value={contrato.cantidadCuotas}
            onChange={(e) => actualizarContrato({ cantidadCuotas: e.target.value })}
            className={claseInput(conError(Number(contrato.cantidadCuotas) > 0))}
          />
          {conError(Number(contrato.cantidadCuotas) > 0) && (
            <p className={claseError}>Ingresá la cantidad de cuotas</p>
          )}
        </div>

        <div>
          <label className={claseLabel}>Importe por cuota</label>
          <input
            type="number"
            min={0}
            value={contrato.importeCuota}
            onChange={(e) => actualizarContrato({ importeCuota: e.target.value })}
            className={claseInput(conError(Number(contrato.importeCuota) > 0))}
          />
          {Number(contrato.importeCuota) > 0 && (
            <p className="mt-1 text-xs text-gray-500">{formatMoneda(Number(contrato.importeCuota))}</p>
          )}
          {conError(Number(contrato.importeCuota) > 0) && (
            <p className={claseError}>Ingresá el importe por cuota</p>
          )}
        </div>

        <div>
          <label className={claseLabel}>Fecha primera cuota</label>
          <input
            type="date"
            value={contrato.fechaPrimeraCuota}
            onChange={(e) => actualizarContrato({ fechaPrimeraCuota: e.target.value })}
            className={claseInput(conError(Boolean(contrato.fechaPrimeraCuota)))}
          />
          {conError(Boolean(contrato.fechaPrimeraCuota)) && (
            <p className={claseError}>Ingresá la fecha de la primera cuota</p>
          )}
        </div>

        <div>
          <label className={claseLabel}>Lugar de pago</label>
          <input
            type="text"
            value={contrato.lugarPago}
            onChange={(e) => actualizarContrato({ lugarPago: e.target.value })}
            className={claseInput(conError(Boolean(contrato.lugarPago.trim())))}
          />
        </div>

        <div>
          <label className={claseLabel}>Tasa de mora anual (%)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={contrato.tasaMoraAnual}
            onChange={(e) => actualizarContrato({ tasaMoraAnual: e.target.value })}
            className={claseInput(false)}
          />
        </div>

        <div>
          <label className={claseLabel}>TEA</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={esPlanAhorro ? '0' : contrato.tea}
            disabled={esPlanAhorro}
            onChange={(e) => actualizarContrato({ tea: e.target.value })}
            className={`${claseInput(false)} ${esPlanAhorro ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          {esPlanAhorro && <p className="mt-1 text-xs text-gray-500">Plan de ahorro: TEA fija en 0%</p>}
        </div>
      </div>

      <div className={claseCard}>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={contrato.seguro.enTramite}
            onChange={(e) =>
              actualizarContrato({ seguro: { ...contrato.seguro, enTramite: e.target.checked } })
            }
            className="h-4 w-4 accent-[#1B4F8A]"
          />
          Seguro en trámite
        </label>

        {!contrato.seguro.enTramite && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={claseLabel}>Compañía de seguros</label>
              <input
                type="text"
                value={contrato.seguro.compania}
                onChange={(e) =>
                  actualizarContrato({ seguro: { ...contrato.seguro, compania: e.target.value } })
                }
                className={claseInput(false)}
              />
            </div>
            <div>
              <label className={claseLabel}>N° de póliza</label>
              <input
                type="text"
                value={contrato.seguro.poliza}
                onChange={(e) =>
                  actualizarContrato({ seguro: { ...contrato.seguro, poliza: e.target.value } })
                }
                className={claseInput(false)}
              />
            </div>
          </div>
        )}
      </div>

      <div className={claseCard}>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={contrato.privilegiosPreexistentes === 'ninguno'}
            onChange={(e) =>
              actualizarContrato({
                privilegiosPreexistentes: e.target.checked ? 'ninguno' : 'con_privilegios',
              })
            }
            className="h-4 w-4 accent-[#1B4F8A]"
          />
          Sin privilegios preexistentes
        </label>

        {contrato.privilegiosPreexistentes === 'con_privilegios' && (
          <div className="mt-4">
            <label className={claseLabel}>Detalle de privilegios preexistentes</label>
            <textarea
              value={contrato.privilegiosTexto}
              onChange={(e) => actualizarContrato({ privilegiosTexto: e.target.value })}
              rows={3}
              className={claseInput(mostrarErrores && !contrato.privilegiosTexto.trim())}
            />
            {mostrarErrores && !contrato.privilegiosTexto.trim() && (
              <p className={claseError}>Describí los privilegios preexistentes</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
