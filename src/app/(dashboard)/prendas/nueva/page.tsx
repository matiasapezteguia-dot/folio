'use client'

import { useEffect, useState } from 'react'
import { usePrendaWizard } from './hooks/usePrendaWizard'
import { validarPaso1, validarPaso2, validarPaso3, validarPaso4, validarPasoDeudoresGarantes } from './validacion'
import PasoIndicador from './components/PasoIndicador'
import Paso1Titular from './components/Paso1Titular'
import Paso2Vehiculo from './components/Paso2Vehiculo'
import Paso3Financiera from './components/Paso3Financiera'
import Paso4DeudoresGarantes from './components/Paso4DeudoresGarantes'
// Nombres de archivo heredados de cuando el wizard tenía 5 pasos: Contrato y
// Revisión ahora se muestran en los pasos 5 y 6 (se corrió uno para insertar
// Deudores/Garantes), no en el 4 que indica su nombre.
import Paso4Contrato from './components/Paso4Contrato'
import Paso5Revision from './components/Paso5Revision'

const TITULOS_PASO = ['Titular/es', 'Vehículo', 'Financiera', 'Deudores/Garantes', 'Contrato', 'Revisión']

export default function NuevaPrendaPage() {
  const pasoActual = usePrendaWizard((estado) => estado.pasoActual)
  const titulares = usePrendaWizard((estado) => estado.titulares)
  const vehiculo = usePrendaWizard((estado) => estado.vehiculo)
  const financiera = usePrendaWizard((estado) => estado.financiera)
  const contrato = usePrendaWizard((estado) => estado.contrato)
  const tieneDeudoresOGarantes = usePrendaWizard((estado) => estado.tieneDeudoresOGarantes)
  const deudoresSolidarios = usePrendaWizard((estado) => estado.deudoresSolidarios)
  const garante = usePrendaWizard((estado) => estado.garante)
  const siguiente = usePrendaWizard((estado) => estado.siguiente)
  const anterior = usePrendaWizard((estado) => estado.anterior)

  const [mostrarErrores, setMostrarErrores] = useState(false)

  useEffect(() => {
    setMostrarErrores(false)
  }, [pasoActual])

  function esPasoActualValido(): boolean {
    switch (pasoActual) {
      case 1:
        return validarPaso1(titulares).valido
      case 2:
        return validarPaso2(vehiculo, contrato.clase).valido
      case 3:
        return validarPaso3(financiera).valido
      case 4:
        return validarPasoDeudoresGarantes(
          tieneDeudoresOGarantes,
          deudoresSolidarios,
          garante,
          financiera.tipoPrenda
        ).valido
      case 5:
        return validarPaso4(contrato, vehiculo).valido
      default:
        return true
    }
  }

  function manejarSiguiente() {
    if (esPasoActualValido()) {
      siguiente()
    } else {
      setMostrarErrores(true)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Nueva prenda</h1>

      <PasoIndicador pasoActual={pasoActual} titulos={TITULOS_PASO} />

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {pasoActual === 1 && <Paso1Titular mostrarErrores={mostrarErrores} />}
        {pasoActual === 2 && <Paso2Vehiculo mostrarErrores={mostrarErrores} />}
        {pasoActual === 3 && <Paso3Financiera mostrarErrores={mostrarErrores} />}
        {pasoActual === 4 && <Paso4DeudoresGarantes mostrarErrores={mostrarErrores} />}
        {pasoActual === 5 && <Paso4Contrato mostrarErrores={mostrarErrores} />}
        {pasoActual === 6 && <Paso5Revision onVolverAEditar={anterior} />}

        {pasoActual < 6 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={anterior}
              disabled={pasoActual === 1}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={manejarSiguiente}
              className="rounded-lg bg-[#1B4F8A] px-5 py-2 text-sm font-medium text-white hover:bg-[#163f6e]"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
