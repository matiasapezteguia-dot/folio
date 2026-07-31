export interface PosicionCampoPx {
  leftPx: number
  topPx: number
}

// Posición en pantalla (esquina donde arranca el texto) de un campo, dado su
// x/y final en puntos PDF. Se usa tanto para renderizar la caja (CampoCanvas)
// como para el hit-test del drag-select en CanvasST03 — un solo lugar con
// la conversión de coordenadas para no repetirla.
export function calcularPosicionCampoPx(
  xPt: number,
  yPt: number,
  alturaPaginaPt: number,
  pxPorPunto: number
): PosicionCampoPx {
  // CSS es Y-hacia-abajo desde el borde superior; PDF es Y-hacia-arriba
  // desde el borde inferior (ver CLAUDE.md).
  return { leftPx: xPt * pxPorPunto, topPx: (alturaPaginaPt - yPt) * pxPorPunto }
}

// Reduce el tamaño de fuente respecto a la escala pt→px real, para que los
// campos no se vean apretados en zonas densas (ej. nacionalidad/sexo/
// profesión/email del deudor en ST-03). Aplica siempre, independiente del
// zoom — es ancho de caja/espaciado, no legibilidad de escala.
const FACTOR_TAMANO_FUENTE = 0.85

interface CampoCanvasProps {
  id: string
  texto: string
  xPt: number
  yPt: number
  sizePt: number
  alturaPaginaPt: number
  pxPorPunto: number
  seleccionado: boolean
  onMouseDownCampo: (id: string, evento: React.MouseEvent) => void
}

// Caja de un campo sobre el canvas. mousedown (no click) porque el mismo
// gesto decide selección Y arranca el arrastre de grupo — ver CanvasST03.
export default function CampoCanvas({
  id,
  texto,
  xPt,
  yPt,
  sizePt,
  alturaPaginaPt,
  pxPorPunto,
  seleccionado,
  onMouseDownCampo,
}: CampoCanvasProps) {
  if (!texto) return null

  const { leftPx, topPx } = calcularPosicionCampoPx(xPt, yPt, alturaPaginaPt, pxPorPunto)

  return (
    <div
      onMouseDown={(evento) => {
        evento.stopPropagation()
        onMouseDownCampo(id, evento)
      }}
      onDragStart={(evento) => evento.preventDefault()}
      className={[
        'absolute select-none whitespace-nowrap border px-0.5 text-left leading-none',
        seleccionado ? 'cursor-move border-[#1B4F8A] bg-[#1B4F8A]/10' : 'cursor-pointer border-transparent hover:border-gray-300',
      ].join(' ')}
      style={{ left: leftPx, top: topPx, fontSize: sizePt * pxPorPunto * FACTOR_TAMANO_FUENTE, transform: 'translateY(-100%)' }}
      title={id}
    >
      {texto}
    </div>
  )
}
