'use client'

import { claseInput, claseLabel } from '../../estilos'

export interface OpcionDocumentoAjuste {
  /** Mismo valor que la key de campo_override.formulario. */
  id: string
  etiqueta: string
}

interface SelectorDocumentoProps {
  opciones: OpcionDocumentoAjuste[]
  idSeleccionado: string
  onSeleccionar: (id: string) => void
}

// Elige qué documento (de los que ya tienen CampoPDF.id habilitado) edita el
// canvas de ajuste de impresión. Sin opción "próximamente" para los
// documentos sin id todavía (Contrato Pág. 2, Hojas de Continuación) — no
// aparecen en la lista hasta que tengan su propia iteración.
export default function SelectorDocumento({ opciones, idSeleccionado, onSeleccionar }: SelectorDocumentoProps) {
  return (
    <div>
      <span className={claseLabel}>Documento</span>
      <select value={idSeleccionado} onChange={(e) => onSeleccionar(e.target.value)} className={claseInput(false)}>
        {opciones.map((opcion) => (
          <option key={opcion.id} value={opcion.id}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </div>
  )
}
