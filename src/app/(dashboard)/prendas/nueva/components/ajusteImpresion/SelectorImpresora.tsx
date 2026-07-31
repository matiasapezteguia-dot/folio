'use client'

import { useState } from 'react'
import type { Impresora } from '@/types'
import { claseInput, claseLabel } from '../../estilos'

interface SelectorImpresoraProps {
  impresoras: Impresora[]
  idSeleccionada: string | undefined
  onSeleccionar: (id: string) => void
  onCrear: (nombre: string) => Promise<void>
}

// Selector de impresora + alta rápida ("nueva impresora"). Sin edición de
// offset global (offset_x/offset_y de impresora) todavía — eso vive en la
// pantalla /impresoras (roadmap, hoy un stub).
export default function SelectorImpresora({ impresoras, idSeleccionada, onSeleccionar, onCrear }: SelectorImpresoraProps) {
  const [nombreNueva, setNombreNueva] = useState('')
  const [creando, setCreando] = useState(false)

  async function manejarCrear() {
    if (!nombreNueva.trim()) return
    setCreando(true)
    try {
      await onCrear(nombreNueva.trim())
      setNombreNueva('')
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <span className={claseLabel}>Impresora</span>
        <select
          value={idSeleccionada ?? ''}
          onChange={(e) => onSeleccionar(e.target.value)}
          disabled={impresoras.length === 0}
          className={claseInput(false)}
        >
          <option value="" disabled={impresoras.length === 0}>
            {impresoras.length === 0 ? 'No hay impresoras — creá una arriba' : 'Seleccioná una impresora'}
          </option>
          {impresoras.map((impresora) => (
            <option key={impresora.id} value={impresora.id}>
              {impresora.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <span className={claseLabel}>Nueva impresora</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={nombreNueva}
            onChange={(e) => setNombreNueva(e.target.value)}
            placeholder="Nombre"
            className={claseInput(false)}
          />
          <button
            type="button"
            onClick={manejarCrear}
            disabled={creando || !nombreNueva.trim()}
            className="whitespace-nowrap rounded-lg bg-[#1B4F8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#163f6e] disabled:opacity-50"
          >
            {creando ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
