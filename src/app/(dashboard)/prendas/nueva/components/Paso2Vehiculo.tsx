'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePrendaWizard } from '../hooks/usePrendaWizard'
import { requiereColor } from '../validacion'
import { claseCard, claseError, claseInput, claseLabel } from '../estilos'
import {
  buscarModelosPorNombre,
  listarMarcasVehiculo,
  listarModelosPorMarca,
  listarTiposPorModelo,
  type ModeloVehiculoConMarca,
} from '@/lib/services/vehiculoService'
import ComboboxBuscable from '@/components/ComboboxBuscable'
import type { CondicionVehiculo, MarcaVehiculo, ModeloVehiculo, ModeloVehiculoTipo, UsoVehiculo } from '@/types'

// Umbral y debounce de la búsqueda inversa de modelo (sin marca todavía):
// menos de 2 caracteres trae demasiadas coincidencias sobre ~47.000 modelos
// para ser útil, y sin debounce cada tecla dispararía una query a Supabase.
const UMBRAL_BUSQUEDA_MODELO = 2
const DEBOUNCE_BUSQUEDA_MODELO_MS = 300

interface Paso2VehiculoProps {
  mostrarErrores: boolean
}

export default function Paso2Vehiculo({ mostrarErrores }: Paso2VehiculoProps) {
  const vehiculo = usePrendaWizard((estado) => estado.vehiculo)
  const actualizarVehiculo = usePrendaWizard((estado) => estado.actualizarVehiculo)
  const clase = usePrendaWizard((estado) => estado.contrato.clase)

  const [marcas, setMarcas] = useState<MarcaVehiculo[]>([])
  const [modelosPorMarca, setModelosPorMarca] = useState<{ idMarca: string; lista: ModeloVehiculo[] } | null>(
    null
  )
  const [tiposPorModelo, setTiposPorModelo] = useState<{ idModelo: string; lista: ModeloVehiculoTipo[] } | null>(
    null
  )
  // Resultados de la búsqueda inversa (modelo → marca), solo relevantes
  // mientras no haya marca seleccionada — ver efecto de abajo.
  const [modelosReversos, setModelosReversos] = useState<ModeloVehiculoConMarca[]>([])

  const conError = (valor: string) => mostrarErrores && !valor.trim()
  const colorRequerido = requiereColor(vehiculo.condicion, clase)
  const colorInvalido = colorRequerido && mostrarErrores && !vehiculo.color.trim()
  const patenteRequerida = vehiculo.condicion === 'usado'
  const patenteInvalida = patenteRequerida && mostrarErrores && !vehiculo.patente.trim()

  const marcaSeleccionada = marcas.find((marca) => marca.nombre === vehiculo.marca)
  const modelosDisponibles =
    marcaSeleccionada && modelosPorMarca?.idMarca === marcaSeleccionada.id ? modelosPorMarca.lista : []
  const modeloSeleccionado = modelosDisponibles.find((modelo) => modelo.nombre === vehiculo.modelo)
  const tipos = useMemo(
    () => (modeloSeleccionado && tiposPorModelo?.idModelo === modeloSeleccionado.id ? tiposPorModelo.lista : []),
    [modeloSeleccionado, tiposPorModelo]
  )

  useEffect(() => {
    let activo = true

    listarMarcasVehiculo().then((resultado) => {
      if (activo) setMarcas(resultado)
    })

    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (!marcaSeleccionada) return

    let activo = true

    listarModelosPorMarca(marcaSeleccionada.id).then((resultado) => {
      if (activo) setModelosPorMarca({ idMarca: marcaSeleccionada.id, lista: resultado })
    })

    return () => {
      activo = false
    }
  }, [marcaSeleccionada])

  useEffect(() => {
    if (!modeloSeleccionado) return

    let activo = true

    listarTiposPorModelo(modeloSeleccionado.id).then((resultado) => {
      if (activo) setTiposPorModelo({ idModelo: modeloSeleccionado.id, lista: resultado })
    })

    return () => {
      activo = false
    }
  }, [modeloSeleccionado])

  // Búsqueda inversa: solo corre cuando todavía no hay marca (si ya hay
  // marca, el modelo se resuelve por listarModelosPorMarca de arriba, como
  // siempre). Debounced para no pegarle a Supabase en cada tecla sobre una
  // tabla de ~47.000 filas.
  useEffect(() => {
    if (vehiculo.marca.trim()) {
      setModelosReversos([])
      return
    }
    const texto = vehiculo.modelo.trim()
    if (texto.length < UMBRAL_BUSQUEDA_MODELO) {
      setModelosReversos([])
      return
    }

    let activo = true
    const idTimeout = setTimeout(() => {
      buscarModelosPorNombre(texto).then((resultado) => {
        if (activo) setModelosReversos(resultado)
      })
    }, DEBOUNCE_BUSQUEDA_MODELO_MS)

    return () => {
      activo = false
      clearTimeout(idTimeout)
    }
  }, [vehiculo.marca, vehiculo.modelo])

  useEffect(() => {
    if (tipos.length === 1) {
      actualizarVehiculo({ tipo: tipos[0].descripcion_tipo })
    }
  }, [tipos, actualizarVehiculo])

  return (
    <div className={claseCard}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={claseLabel}>Marca</label>
          <ComboboxBuscable
            valor={vehiculo.marca}
            opciones={marcas.map((marca) => ({ id: marca.id, etiqueta: marca.nombre }))}
            onCambiar={(texto, opcion) => {
              if (opcion) {
                actualizarVehiculo({
                  marca: opcion.etiqueta,
                  modelo: '',
                  tipo: '',
                  marcaMotor: opcion.etiqueta,
                  marcaChasis: opcion.etiqueta,
                })
              } else {
                actualizarVehiculo({ marca: texto })
              }
            }}
            placeholder="Escribí para buscar…"
            invalido={conError(vehiculo.marca)}
          />
          {conError(vehiculo.marca) && <p className={claseError}>Ingresá la marca</p>}
        </div>

        <div>
          <label className={claseLabel}>Tipo</label>
          {tipos.length === 1 ? (
            <input
              type="text"
              value={tipos[0].descripcion_tipo}
              readOnly
              className={claseInput(false) + ' cursor-not-allowed bg-gray-100'}
            />
          ) : tipos.length >= 2 ? (
            <ComboboxBuscable
              valor={vehiculo.tipo}
              opciones={tipos.map((tipo) => ({ id: tipo.id, etiqueta: tipo.descripcion_tipo }))}
              onCambiar={(texto, opcion) => {
                actualizarVehiculo({ tipo: opcion ? opcion.etiqueta : texto })
              }}
              placeholder="Seleccioná el tipo…"
              invalido={conError(vehiculo.tipo)}
            />
          ) : (
            <input
              type="text"
              value={vehiculo.tipo}
              onChange={(e) => actualizarVehiculo({ tipo: e.target.value })}
              placeholder="SEDAN 4 PUERTAS, PICK-UP, FURGÓN…"
              className={claseInput(conError(vehiculo.tipo))}
            />
          )}
          {conError(vehiculo.tipo) && <p className={claseError}>Ingresá el tipo</p>}
        </div>

        <div>
          <label className={claseLabel}>Modelo</label>
          <ComboboxBuscable
            valor={vehiculo.modelo}
            opciones={
              vehiculo.marca.trim()
                ? modelosDisponibles.map((modelo) => ({ id: modelo.id, etiqueta: modelo.nombre }))
                : modelosReversos.map((r) => ({ id: r.modelo.id, etiqueta: `${r.modelo.nombre} — ${r.marca.nombre}` }))
            }
            onCambiar={(texto, opcion) => {
              if (!opcion) {
                actualizarVehiculo({ modelo: texto, tipo: '' })
                return
              }
              if (vehiculo.marca.trim()) {
                actualizarVehiculo({ modelo: opcion.etiqueta, tipo: '' })
                return
              }
              // Modo inverso: opcion.etiqueta es "Modelo — MARCA" (compuesta,
              // solo para mostrar) — el nombre real de modelo y marca salen
              // de la fila encontrada por id, no de la etiqueta.
              const encontrado = modelosReversos.find((r) => r.modelo.id === opcion.id)
              if (!encontrado) return
              actualizarVehiculo({
                marca: encontrado.marca.nombre,
                modelo: encontrado.modelo.nombre,
                tipo: '',
                marcaMotor: encontrado.marca.nombre,
                marcaChasis: encontrado.marca.nombre,
              })
            }}
            placeholder="Escribí para buscar…"
            invalido={conError(vehiculo.modelo)}
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
          {conError(vehiculo.marcaMotor) ? (
            <p className={claseError}>Ingresá la marca del motor</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Autocompletado desde la marca del vehículo</p>
          )}
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
          {conError(vehiculo.marcaChasis) ? (
            <p className={claseError}>Ingresá la marca del chasis</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Autocompletado desde la marca del vehículo</p>
          )}
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
            disabled={vehiculo.condicion === '0km'}
            placeholder={vehiculo.condicion === '0km' ? 'No aplica (0km)' : undefined}
            className={`${claseInput(patenteInvalida)} ${
              vehiculo.condicion === '0km' ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          />
          {vehiculo.condicion === '0km' ? (
            <p className="mt-1 text-xs text-gray-500">
              No aplica — el vehículo 0km todavía no tiene patente asignada.
            </p>
          ) : (
            patenteInvalida && <p className={claseError}>Ingresá el dominio/patente</p>
          )}
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
                  onChange={() => actualizarVehiculo({ condicion: valor, patente: valor === '0km' ? '' : vehiculo.patente })}
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
