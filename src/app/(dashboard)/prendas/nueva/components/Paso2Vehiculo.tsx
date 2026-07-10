'use client'

import { usePrendaWizard } from '../hooks/usePrendaWizard'
import { requiereColor } from '../validacion'
import { claseCard, claseError, claseInput, claseLabel } from '../estilos'
import type { CondicionVehiculo, UsoVehiculo } from '@/types'

interface Paso2VehiculoProps {
  mostrarErrores: boolean
}

export default function Paso2Vehiculo({ mostrarErrores }: Paso2VehiculoProps) {
  const vehiculo = usePrendaWizard((estado) => estado.vehiculo)
  const actualizarVehiculo = usePrendaWizard((estado) => estado.actualizarVehiculo)
  const clase = usePrendaWizard((estado) => estado.contrato.clase)

  const conError = (valor: string) => mostrarErrores && !valor.trim()
  const colorRequerido = requiereColor(vehiculo.condicion, clase)
  const colorInvalido = colorRequerido && mostrarErrores && !vehiculo.color.trim()

  return (
    <div className={claseCard}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={claseLabel}>Marca</label>
          <input
            type="text"
            value={vehiculo.marca}
            onChange={(e) => actualizarVehiculo({ marca: e.target.value })}
            className={claseInput(conError(vehiculo.marca))}
          />
          {conError(vehiculo.marca) && <p className={claseError}>Ingresá la marca</p>}
        </div>

        <div>
          <label className={claseLabel}>Tipo</label>
          <input
            type="text"
            value={vehiculo.tipo}
            onChange={(e) => actualizarVehiculo({ tipo: e.target.value })}
            placeholder="SEDAN 4 PUERTAS, PICK-UP, FURGÓN…"
            className={claseInput(conError(vehiculo.tipo))}
          />
          {conError(vehiculo.tipo) && <p className={claseError}>Ingresá el tipo</p>}
        </div>

        <div>
          <label className={claseLabel}>Modelo</label>
          <input
            type="text"
            value={vehiculo.modelo}
            onChange={(e) => actualizarVehiculo({ modelo: e.target.value })}
            className={claseInput(conError(vehiculo.modelo))}
          />
          {conError(vehiculo.modelo) && <p className={claseError}>Ingresá el modelo</p>}
        </div>

        <div>
          <label className={claseLabel}>Marca motor</label>
          <input
            type="text"
            value={vehiculo.marcaMotor}
            onChange={(e) => actualizarVehiculo({ marcaMotor: e.target.value })}
            className={claseInput(conError(vehiculo.marcaMotor))}
          />
          {conError(vehiculo.marcaMotor) && <p className={claseError}>Ingresá la marca del motor</p>}
        </div>

        <div>
          <label className={claseLabel}>N° motor</label>
          <input
            type="text"
            value={vehiculo.numeroMotor}
            onChange={(e) => actualizarVehiculo({ numeroMotor: e.target.value })}
            className={claseInput(conError(vehiculo.numeroMotor))}
          />
          {conError(vehiculo.numeroMotor) && <p className={claseError}>Ingresá el número de motor</p>}
        </div>

        <div>
          <label className={claseLabel}>Marca chasis</label>
          <input
            type="text"
            value={vehiculo.marcaChasis}
            onChange={(e) => actualizarVehiculo({ marcaChasis: e.target.value })}
            className={claseInput(conError(vehiculo.marcaChasis))}
          />
          {conError(vehiculo.marcaChasis) && <p className={claseError}>Ingresá la marca del chasis</p>}
        </div>

        <div>
          <label className={claseLabel}>N° chasis</label>
          <input
            type="text"
            value={vehiculo.numeroChasis}
            onChange={(e) => actualizarVehiculo({ numeroChasis: e.target.value })}
            className={claseInput(conError(vehiculo.numeroChasis))}
          />
          {conError(vehiculo.numeroChasis) && <p className={claseError}>Ingresá el número de chasis</p>}
        </div>

        <div>
          <label className={claseLabel}>Dominio / patente</label>
          <input
            type="text"
            value={vehiculo.patente}
            onChange={(e) => actualizarVehiculo({ patente: e.target.value.toUpperCase() })}
            placeholder="Vacío si es 0km"
            className={claseInput(false)}
          />
        </div>

        <div>
          <label className={claseLabel}>Color</label>
          <input
            type="text"
            value={vehiculo.color}
            onChange={(e) => actualizarVehiculo({ color: e.target.value })}
            className={claseInput(colorInvalido)}
          />
          {colorInvalido ? (
            <p className={claseError}>El color es obligatorio en prenda flotante sobre 0km (DNTR)</p>
          ) : (
            colorRequerido && (
              <p className="mt-1 text-xs text-gray-500">Obligatorio en prenda flotante sobre 0km (DNTR)</p>
            )
          )}
        </div>

        <div>
          <span className={claseLabel}>Condición</span>
          <div className="flex gap-4">
            {(['0km', 'usado'] satisfies CondicionVehiculo[]).map((valor) => (
              <label
                key={valor}
                className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm has-[:checked]:border-[#1B4F8A] has-[:checked]:bg-[#1B4F8A]/5"
              >
                <input
                  type="radio"
                  name="condicion"
                  value={valor}
                  checked={vehiculo.condicion === valor}
                  onChange={() => actualizarVehiculo({ condicion: valor })}
                  className="h-4 w-4 accent-[#1B4F8A]"
                />
                {valor === '0km' ? '0km' : 'Usado'}
              </label>
            ))}
          </div>
          {mostrarErrores && !vehiculo.condicion && (
            <p className={claseError}>Seleccioná la condición</p>
          )}
        </div>

        <div>
          <span className={claseLabel}>Uso</span>
          <div className="flex gap-4">
            {(['particular', 'comercial'] satisfies UsoVehiculo[]).map((valor) => (
              <label
                key={valor}
                className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm has-[:checked]:border-[#1B4F8A] has-[:checked]:bg-[#1B4F8A]/5"
              >
                <input
                  type="radio"
                  name="uso"
                  value={valor}
                  checked={vehiculo.uso === valor}
                  onChange={() => actualizarVehiculo({ uso: valor })}
                  className="h-4 w-4 accent-[#1B4F8A]"
                />
                {valor === 'particular' ? 'Particular' : 'Comercial'}
              </label>
            ))}
          </div>
          {mostrarErrores && !vehiculo.uso && <p className={claseError}>Seleccioná el uso</p>}
        </div>
      </div>
    </div>
  )
}
