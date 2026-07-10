'use client'

import { usePrendaWizard } from '../hooks/usePrendaWizard'
import { listarFinancieras } from '@/lib/services/financieraService'
import { claseCard, claseError, claseInput, claseLabel } from '../estilos'
import type { TipoPrenda } from '@/types'

const OPCIONES_TIPO_PRENDA: { valor: TipoPrenda; etiqueta: string }[] = [
  { valor: 'compania_financiera', etiqueta: 'Compañía financiera' },
  { valor: 'plan_ahorro', etiqueta: 'Plan de ahorro' },
]

interface Paso3FinancieraProps {
  mostrarErrores: boolean
}

export default function Paso3Financiera({ mostrarErrores }: Paso3FinancieraProps) {
  const financiera = usePrendaWizard((estado) => estado.financiera)
  const actualizarFinanciera = usePrendaWizard((estado) => estado.actualizarFinanciera)
  const financieras = listarFinancieras()

  function manejarSeleccionFinanciera(id: string) {
    const seleccionada = financieras.find((financieraOpcion) => financieraOpcion.id === id)
    if (!seleccionada) {
      actualizarFinanciera({ idFinanciera: '', nombreFinanciera: '', acreedor: undefined })
      return
    }
    actualizarFinanciera({
      idFinanciera: seleccionada.id,
      nombreFinanciera: seleccionada.nombre,
      tipoPrenda: seleccionada.tipoPrenda,
      acreedor: seleccionada.acreedor,
    })
  }

  return (
    <div className="space-y-6">
      <div className={claseCard}>
        <label className={claseLabel}>Financiera</label>
        <select
          value={financiera.idFinanciera}
          onChange={(e) => manejarSeleccionFinanciera(e.target.value)}
          className={claseInput(mostrarErrores && !financiera.idFinanciera)}
        >
          <option value="">Seleccioná una financiera</option>
          {financieras.map((financieraOpcion) => (
            <option key={financieraOpcion.id} value={financieraOpcion.id}>
              {financieraOpcion.nombre}
            </option>
          ))}
        </select>
        {mostrarErrores && !financiera.idFinanciera && (
          <p className={claseError}>Seleccioná una financiera</p>
        )}

        {financiera.acreedor && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Datos del acreedor
            </p>
            <p>
              <span className="text-gray-400">CUIT:</span> {financiera.acreedor.cuit}
            </p>
            <p>
              <span className="text-gray-400">Domicilio:</span> {financiera.acreedor.calle}{' '}
              {financiera.acreedor.numero}, {financiera.acreedor.localidad}, {financiera.acreedor.provincia}
            </p>
            <p>
              <span className="text-gray-400">Apoderado:</span> {financiera.acreedor.apoderado}
            </p>
          </div>
        )}
      </div>

      <div className={claseCard}>
        <span className={claseLabel}>Tipo de prenda</span>
        <div className="flex gap-4">
          {OPCIONES_TIPO_PRENDA.map((opcion) => (
            <label
              key={opcion.valor}
              className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm has-[:checked]:border-[#1B4F8A] has-[:checked]:bg-[#1B4F8A]/5"
            >
              <input
                type="radio"
                name="tipoPrenda"
                value={opcion.valor}
                checked={financiera.tipoPrenda === opcion.valor}
                onChange={() => actualizarFinanciera({ tipoPrenda: opcion.valor })}
                className="h-4 w-4 accent-[#1B4F8A]"
              />
              {opcion.etiqueta}
            </label>
          ))}
        </div>
        {mostrarErrores && !financiera.tipoPrenda && (
          <p className={claseError}>Seleccioná el tipo de prenda</p>
        )}
      </div>
    </div>
  )
}
