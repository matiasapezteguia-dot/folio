'use client'

import { useEffect, useId, useRef, useState } from 'react'

export interface OpcionCombobox {
  id: string
  etiqueta: string
}

interface ComboboxBuscableProps {
  valor: string
  onCambiar: (texto: string, opcion: OpcionCombobox | null) => void
  opciones: OpcionCombobox[]
  placeholder?: string
  disabled?: boolean
  invalido?: boolean
  className?: string
  id?: string
  maxOpcionesVisibles?: number
}

export default function ComboboxBuscable({
  valor,
  onCambiar,
  opciones,
  placeholder,
  disabled = false,
  invalido = false,
  className,
  id,
  maxOpcionesVisibles = 50,
}: ComboboxBuscableProps) {
  const [abierto, setAbierto] = useState(false)
  const [indiceActivo, setIndiceActivo] = useState(-1)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const listaId = useId()

  const filtradas = valor.trim()
    ? opciones.filter((opcion) => opcion.etiqueta.toLowerCase().includes(valor.trim().toLowerCase()))
    : opciones
  const visibles = filtradas.slice(0, maxOpcionesVisibles)

  useEffect(() => {
    function alHacerClickAfuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false)
      }
    }

    document.addEventListener('mousedown', alHacerClickAfuera)
    return () => document.removeEventListener('mousedown', alHacerClickAfuera)
  }, [])

  function seleccionar(opcion: OpcionCombobox) {
    onCambiar(opcion.etiqueta, opcion)
    setAbierto(false)
    setIndiceActivo(-1)
  }

  function alPresionarTecla(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (!abierto && (evento.key === 'ArrowDown' || evento.key === 'ArrowUp')) {
      setAbierto(true)
      return
    }
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setIndiceActivo((indice) => Math.min(indice + 1, visibles.length - 1))
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setIndiceActivo((indice) => Math.max(indice - 1, 0))
    } else if (evento.key === 'Enter') {
      if (abierto && indiceActivo >= 0 && visibles[indiceActivo]) {
        evento.preventDefault()
        seleccionar(visibles[indiceActivo])
      }
    } else if (evento.key === 'Escape') {
      setAbierto(false)
      setIndiceActivo(-1)
    }
  }

  const claseBase = [
    'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/40 focus:border-[#1B4F8A]',
    invalido ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
    disabled ? 'cursor-not-allowed bg-gray-100' : '',
  ].join(' ')

  return (
    <div ref={contenedorRef} className={['relative', className].filter(Boolean).join(' ')}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={abierto}
        aria-autocomplete="list"
        aria-controls={listaId}
        aria-activedescendant={indiceActivo >= 0 ? `${listaId}-${indiceActivo}` : undefined}
        autoComplete="off"
        value={valor}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          onCambiar(e.target.value, null)
          setAbierto(true)
          setIndiceActivo(-1)
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alPresionarTecla}
        className={claseBase}
      />

      {abierto && visibles.length > 0 && (
        <ul id={listaId} role="listbox" className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {visibles.map((opcion, indice) => (
            <li key={opcion.id} id={`${listaId}-${indice}`} role="option" aria-selected={indice === indiceActivo}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => seleccionar(opcion)}
                className={[
                  'block w-full px-3 py-2 text-left',
                  indice === indiceActivo ? 'bg-[#1B4F8A]/10 text-[#1B4F8A]' : 'text-gray-900 hover:bg-gray-50',
                ].join(' ')}
              >
                {opcion.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
