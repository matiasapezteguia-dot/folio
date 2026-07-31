import { puntosAMm } from './conversion'

export const ANCHO_REGLA_PX = 20
const PASO_MENOR_MM = 5
const PASO_MAYOR_MM = 10

interface ReglaMMProps {
  /** Ancho o alto de la página en puntos PDF (según orientación). */
  longitudPuntos: number
  pxPorPunto: number
  orientacion: 'horizontal' | 'vertical'
}

// Regla numerada en mm, inspirada en las capturas de Autoforms — marca cada
// 5mm, etiqueta cada 10mm. Puramente visual, no interactúa con el canvas.
export default function ReglaMM({ longitudPuntos, pxPorPunto, orientacion }: ReglaMMProps) {
  const longitudMm = puntosAMm(longitudPuntos)
  const marcas: number[] = []
  for (let mm = 0; mm <= longitudMm; mm += PASO_MENOR_MM) marcas.push(mm)

  const pxPorMm = pxPorPunto / 0.352

  return (
    <div
      className="relative shrink-0 bg-gray-50"
      style={
        orientacion === 'horizontal'
          ? { width: longitudMm * pxPorMm, height: ANCHO_REGLA_PX }
          : { width: ANCHO_REGLA_PX, height: longitudMm * pxPorMm }
      }
    >
      {marcas.map((mm) => {
        const esMayor = mm % PASO_MAYOR_MM === 0
        const posicionPx = mm * pxPorMm
        return (
          <div
            key={mm}
            className="absolute bg-gray-400"
            style={
              orientacion === 'horizontal'
                ? { left: posicionPx, top: esMayor ? 0 : ANCHO_REGLA_PX / 2, width: 1, height: esMayor ? ANCHO_REGLA_PX : ANCHO_REGLA_PX / 2 }
                : { top: posicionPx, left: esMayor ? 0 : ANCHO_REGLA_PX / 2, height: 1, width: esMayor ? ANCHO_REGLA_PX : ANCHO_REGLA_PX / 2 }
            }
          >
            {esMayor && (
              <span
                className="absolute whitespace-nowrap text-[9px] text-gray-500"
                style={orientacion === 'horizontal' ? { left: 2, top: ANCHO_REGLA_PX } : { top: -6, left: ANCHO_REGLA_PX + 2 }}
              >
                {mm}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
