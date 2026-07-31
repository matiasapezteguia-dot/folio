import { claseLabel } from '../../estilos'

interface ControlZoomProps {
  porcentaje: number
  enMinimo: boolean
  enMaximo: boolean
  onAcercar: () => void
  onAlejar: () => void
  onReset: () => void
}

// Zoom relativo al fit-to-width: 100% = la página completa entra en el
// ancho disponible sin scroll horizontal (ver escalaFit en
// PasoAjusteImpresion.tsx). Alejar nunca baja de ahí — no tiene sentido ver
// la página más chica que el ajuste automático. Acercar tiene techo relativo
// a ese mismo fit (escalaMaxima = escalaFit * TECHO_ZOOM_RELATIVO), no un
// valor absoluto de px/pt — así "el máximo" se lee igual sin importar el
// ancho de pantalla del usuario.
// Layout (flex/gap/tamaños) en inline style, no clases de Tailwind: el
// espaciado se rompía en la app real (botones pegados sin gap, "100%"
// partido en dos líneas) pese a que el mismo markup se veía bien en el
// mockup estático — indicio de que Tailwind no estaba generando el CSS para
// estas clases en el momento (JIT/caché del dev server), no un error de
// markup. Inline style no depende de ese pipeline, así que no puede fallar
// de la misma forma. Colores/hover se dejan en clases: no son críticos para
// que el control sea usable si alguna vez vuelve a pasar.
const estiloFila: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
const estiloBotonZoom: React.CSSProperties = { width: 28, height: 28, flexShrink: 0 }
const estiloPorcentaje: React.CSSProperties = { minWidth: '3.5rem', flexShrink: 0, textAlign: 'center' }

export default function ControlZoom({ porcentaje, enMinimo, enMaximo, onAcercar, onAlejar, onReset }: ControlZoomProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className={`${claseLabel} mb-0`}>Zoom</span>
      <div style={estiloFila}>
        <button
          type="button"
          onClick={onAlejar}
          disabled={enMinimo}
          title="Alejar"
          style={estiloBotonZoom}
          className="rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <button
          type="button"
          onClick={onReset}
          title="Volver a ajustar al ancho disponible"
          style={estiloPorcentaje}
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          {porcentaje}%
        </button>
        <button
          type="button"
          onClick={onAcercar}
          disabled={enMaximo}
          title="Acercar"
          style={estiloBotonZoom}
          className="rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}
