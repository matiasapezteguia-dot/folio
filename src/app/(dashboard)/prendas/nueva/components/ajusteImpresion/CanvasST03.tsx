import { useCallback, useEffect, useRef, useState } from 'react'
import type { CampoPDF } from '@/types/pdf'
import ReglaMM, { ANCHO_REGLA_PX } from './ReglaMM'
import CampoCanvas, { calcularPosicionCampoPx } from './CampoCanvas'

export type ModoSeleccion = 'reemplazar' | 'agregar' | 'toggle'

interface CanvasST03Props {
  tamanoPaginaPt: [number, number]
  pxPorPunto: number
  /** Campos con la posición final ya calculada (base + offset de sesión). */
  campos: (CampoPDF & { id: string })[]
  seleccionados: Set<string>
  onSeleccionarCampos: (ids: string[], modo: ModoSeleccion) => void
  /** Delta en puntos PDF (no px) a aplicar a TODOS los campos seleccionados. */
  onMoverCampos: (deltaXpt: number, deltaYpt: number) => void
}

const UMBRAL_ARRASTRE_PX = 3

// Página ST-03 a escala con regla en mm arriba/izquierda, inspirado en las
// capturas de Autoforms. Un mismo gesto de mouse resuelve tres cosas:
//  - click en un campo: lo selecciona (reemplaza selección)
//  - shift+click en un campo: lo agrega/saca de la selección (toggle)
//  - arrastrar desde un campo ya seleccionado: mueve TODO el grupo
//  - arrastrar desde el fondo: marquee-select (rectángulo); con shift agrega
//    a la selección existente en vez de reemplazarla
export default function CanvasST03({
  tamanoPaginaPt,
  pxPorPunto,
  campos,
  seleccionados,
  onSeleccionarCampos,
  onMoverCampos,
}: CanvasST03Props) {
  const [anchoPt, altoPt] = tamanoPaginaPt
  const anchoPx = anchoPt * pxPorPunto
  const altoPx = altoPt * pxPorPunto

  const contenedorRef = useRef<HTMLDivElement>(null)
  const arrastreRef = useRef<
    | { tipo: 'mover'; ultimoX: number; ultimoY: number }
    | { tipo: 'marquee'; inicioX: number; inicioY: number; agregar: boolean }
    | null
  >(null)
  const [marquee, setMarquee] = useState<{ x: number; y: number; ancho: number; alto: number } | null>(null)
  // Se activa en cualquier mousedown que arme un gesto de arrastre (marquee o
  // mover grupo) y se apaga en mouseup — sin esto el navegador selecciona el
  // texto de los campos como texto de página normal durante el drag.
  const [arrastrando, setArrastrando] = useState(false)
  // Espejo síncrono de `marquee` para leer en manejarMouseUp sin pasar por el
  // actualizador funcional de setState (ver comentario en manejarMouseUp:
  // llamar a onSeleccionarCampos desde ADENTRO de un actualizador de
  // setMarquee dispara "Cannot update a component while rendering a
  // different component", porque React puede invocar ese actualizador
  // durante el render/reconciliación, no como un evento real).
  const marqueeRef = useRef<{ x: number; y: number; ancho: number; alto: number } | null>(null)

  const actualizarMarquee = useCallback((valor: typeof marquee) => {
    marqueeRef.current = valor
    setMarquee(valor)
  }, [])

  useEffect(() => {
    function manejarMouseMove(evento: MouseEvent) {
      const arrastre = arrastreRef.current
      if (!arrastre) return

      if (arrastre.tipo === 'mover') {
        const deltaXpx = evento.clientX - arrastre.ultimoX
        const deltaYpx = evento.clientY - arrastre.ultimoY
        if (deltaXpx === 0 && deltaYpx === 0) return
        arrastre.ultimoX = evento.clientX
        arrastre.ultimoY = evento.clientY
        // Pantalla Y-hacia-abajo, PDF Y-hacia-arriba: se invierte el signo.
        onMoverCampos(deltaXpx / pxPorPunto, -deltaYpx / pxPorPunto)
        return
      }

      const rect = contenedorRef.current?.getBoundingClientRect()
      if (!rect) return
      const xActual = evento.clientX - rect.left
      const yActual = evento.clientY - rect.top
      actualizarMarquee({
        x: Math.min(arrastre.inicioX, xActual),
        y: Math.min(arrastre.inicioY, yActual),
        ancho: Math.abs(xActual - arrastre.inicioX),
        alto: Math.abs(yActual - arrastre.inicioY),
      })
    }

    // Handler DOM real (no un actualizador de setState): acá sí es seguro
    // llamar onSeleccionarCampos, que termina actualizando el estado del
    // componente padre (PasoAjusteImpresion).
    function manejarMouseUp() {
      const arrastre = arrastreRef.current
      if (arrastre?.tipo === 'marquee') {
        const rect = marqueeRef.current
        if (rect && (rect.ancho > UMBRAL_ARRASTRE_PX || rect.alto > UMBRAL_ARRASTRE_PX)) {
          // Hit-test por un solo punto (la esquina donde arranca el texto,
          // ver calcularPosicionCampoPx), no por el bounding-box completo
          // del campo. Para ST-03 los campos son cortos y esto alcanza,
          // pero un campo con caja ancha puede visualmente tocar el
          // marquee por su tramo derecho y no quedar seleccionado si el
          // rectángulo no llega a cubrir ese punto de anclaje. Revisar si
          // se migra este editor a templates con campos más anchos
          // (Contrato, Hojas de Continuación) — ahí puede hacer falta
          // intersección real de rectángulos (ancho estimado por
          // texto.length * size, o medir con canvas.measureText).
          const idsEnRect = campos
            .filter((campo) => {
              const { leftPx, topPx } = calcularPosicionCampoPx(campo.x, campo.y, altoPt, pxPorPunto)
              return leftPx >= rect.x && leftPx <= rect.x + rect.ancho && topPx >= rect.y && topPx <= rect.y + rect.alto
            })
            .map((campo) => campo.id)
          onSeleccionarCampos(idsEnRect, arrastre.agregar ? 'agregar' : 'reemplazar')
        } else if (!arrastre.agregar) {
          // Click simple en el fondo, sin arrastre real: limpia selección.
          onSeleccionarCampos([], 'reemplazar')
        }
        actualizarMarquee(null)
      }
      arrastreRef.current = null
      setArrastrando(false)
    }

    window.addEventListener('mousemove', manejarMouseMove)
    window.addEventListener('mouseup', manejarMouseUp)
    return () => {
      window.removeEventListener('mousemove', manejarMouseMove)
      window.removeEventListener('mouseup', manejarMouseUp)
    }
  }, [campos, altoPt, pxPorPunto, onMoverCampos, onSeleccionarCampos, actualizarMarquee])

  function manejarMouseDownCampo(id: string, evento: React.MouseEvent) {
    // preventDefault, no solo CSS user-select: es lo que efectivamente
    // frena la selección nativa de texto del navegador al arrancar el
    // arrastre (la clase select-none condicional solo no alcanzaba).
    evento.preventDefault()
    if (evento.shiftKey) {
      onSeleccionarCampos([id], 'toggle')
      return
    }
    if (!seleccionados.has(id)) {
      onSeleccionarCampos([id], 'reemplazar')
    }
    arrastreRef.current = { tipo: 'mover', ultimoX: evento.clientX, ultimoY: evento.clientY }
    setArrastrando(true)
  }

  function manejarMouseDownFondo(evento: React.MouseEvent) {
    evento.preventDefault()
    const rect = contenedorRef.current?.getBoundingClientRect()
    if (!rect) return
    arrastreRef.current = {
      tipo: 'marquee',
      inicioX: evento.clientX - rect.left,
      inicioY: evento.clientY - rect.top,
      agregar: evento.shiftKey,
    }
    actualizarMarquee({ x: evento.clientX - rect.left, y: evento.clientY - rect.top, ancho: 0, alto: 0 })
    setArrastrando(true)
  }

  return (
    <div className={`inline-block${arrastrando ? ' select-none' : ''}`}>
      <div className="flex">
        <div style={{ width: ANCHO_REGLA_PX, height: ANCHO_REGLA_PX }} className="shrink-0 bg-gray-50" />
        <ReglaMM longitudPuntos={anchoPt} pxPorPunto={pxPorPunto} orientacion="horizontal" />
      </div>
      <div className="flex">
        <ReglaMM longitudPuntos={altoPt} pxPorPunto={pxPorPunto} orientacion="vertical" />
        <div
          ref={contenedorRef}
          // border-2 (no el border de 1px que ya había) para que el límite
          // real de la hoja Legal se note como marco, no como una línea que
          // se pierde contra el fondo blanco de la tarjeta del paso.
          className="relative shrink-0 border-2 border-gray-400 bg-white shadow-sm"
          style={{ width: anchoPx, height: altoPx }}
          onMouseDown={manejarMouseDownFondo}
        >
          {campos.map((campo) => (
            <CampoCanvas
              key={campo.id}
              id={campo.id}
              texto={campo.texto}
              xPt={campo.x}
              yPt={campo.y}
              sizePt={campo.size ?? 10}
              alturaPaginaPt={altoPt}
              pxPorPunto={pxPorPunto}
              seleccionado={seleccionados.has(campo.id)}
              onMouseDownCampo={manejarMouseDownCampo}
            />
          ))}

          {marquee && (
            <div
              className="pointer-events-none absolute border border-dashed border-[#1B4F8A] bg-[#1B4F8A]/10"
              style={{ left: marquee.x, top: marquee.y, width: marquee.ancho, height: marquee.alto }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
