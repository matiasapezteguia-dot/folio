'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePrendaWizard, type OffsetCampo } from '../hooks/usePrendaWizard'
import { mapWizardAPrendaParaImprimir } from '@/lib/services/prendaService'
// TEMP(validación Etapa 2 — generalización del canvas): swap manual a ST-02
// para confirmar en el navegador que CanvasFormulario funciona igual de bien
// con otro template (selección, drag, marquee, nudge, zoom, guardar/precargar
// defaults con formulario='st02' en campo_override) antes de construir el
// selector real de documento/formulario de la próxima iteración. Revertir a
// st03.ts (o reemplazar por el selector) una vez validado.
import { ST02_TAMANO_PAGINA, buildST02Fields } from '@/lib/pdf/templates/st02'
import { listarImpresoras, crearImpresora } from '@/lib/services/impresoraService'
import { listarOverrides, guardarOverrides } from '@/lib/services/campoOverrideService'
import type { Impresora } from '@/types'
import { claseCard } from '../estilos'
import CanvasFormulario, { type ModoSeleccion } from './ajusteImpresion/CanvasFormulario'
import { ANCHO_REGLA_PX } from './ajusteImpresion/ReglaMM'
import ControlZoom from './ajusteImpresion/ControlZoom'
import SelectorImpresora from './ajusteImpresion/SelectorImpresora'
import { mmAPuntos } from './ajusteImpresion/conversion'
import { aplicarOffsetsImpresion } from '@/lib/pdf/offsetsImpresion'

// TEMP: 'st02' mientras dura la validación de arriba — ver comentario del import.
const FORMULARIO = 'st02'
const [ANCHO_PAGINA_PT] = ST02_TAMANO_PAGINA
// Techo de zoom RELATIVO a escalaFit (300% del fit-to-width vigente), no un
// valor absoluto de px/pt — un techo absoluto (ej. 1.3) da un porcentaje
// relativo distinto según el ancho de pantalla (132% en una prueba real con
// escalaFit=0.986, pero sería otro % en una ventana más angosta). Con el
// techo relativo, "el zoom máximo" siempre se lee igual sin importar la
// pantalla del usuario.
const TECHO_ZOOM_RELATIVO = 3
// Techo absoluto de escalaFit en sí (no del zoom manual): solo para que el
// ajuste automático no renderice texto gigante en una ventana enorme. No
// tiene relación con TECHO_ZOOM_RELATIVO.
const ESCALA_FIT_MAXIMA_ABSOLUTA = 2.0
// Piso absoluto de emergencia, solo para el primer render antes de que
// ResizeObserver mida el contenedor (o si mide 0 por algún motivo raro).
const ESCALA_MINIMA_ABSOLUTA = 0.4
// Paso de zoom relativo al fit-to-width vigente (10% de esa escala por
// click), no un valor pt fijo — así el paso se siente igual de "grande"
// sin importar el ancho real del contenedor.
const PASO_ZOOM_RELATIVO = 0.1
// Delta fijo del nudge con flechas del teclado. Ya no es elegible por el
// usuario (era SelectorPasoNudge, eliminado): el mouse (drag, continuo/
// preciso) y el teclado (este delta) alcanzan sin exponer un selector más.
// 1mm porque es el mismo piso que Autoforms ofrecía como paso más fino.
const PASO_NUDGE_MM = 1

function clamp(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor))
}

// Referencia estable para el fallback "sin offsets" — un {} literal nuevo en
// cada render rompería la memoización de camposConPosicion de abajo (useMemo
// compara por referencia) y, en cadena, haría que CanvasFormulario recree sus
// listeners de window en cada render (ver fix de CanvasFormulario.tsx).
const OFFSETS_VACIO: Record<string, OffsetCampo> = {}

// Paso "ajuste-impresion" del wizard (entre Contrato y Revisión). Editor
// visual de offsets aditivos por campo, scopeados por impresora — ver
// scripts/referencias/campo_override.sql y CLAUDE.md.
//
// Selección múltiple (click/shift-click/drag-select) y arrastre con mouse
// viven en CanvasFormulario; acá solo se traducen a llamadas a
// moverCampoImpresion por cada id seleccionado.
export default function PasoAjusteImpresion() {
  const titulares = usePrendaWizard((estado) => estado.titulares)
  const vehiculo = usePrendaWizard((estado) => estado.vehiculo)
  const financiera = usePrendaWizard((estado) => estado.financiera)
  const contrato = usePrendaWizard((estado) => estado.contrato)
  const deudoresSolidarios = usePrendaWizard((estado) => estado.deudoresSolidarios)
  const garante = usePrendaWizard((estado) => estado.garante)
  const idImpresoraSeleccionada = usePrendaWizard((estado) => estado.idImpresoraSeleccionada)
  const offsetsImpresionPorImpresora = usePrendaWizard((estado) => estado.offsetsImpresionPorImpresora)
  const impresorasConDefaultsCargados = usePrendaWizard((estado) => estado.impresorasConDefaultsCargados)
  const setImpresoraSeleccionada = usePrendaWizard((estado) => estado.setImpresoraSeleccionada)
  const precargarDefaultsImpresora = usePrendaWizard((estado) => estado.precargarDefaultsImpresora)
  const moverCampoImpresion = usePrendaWizard((estado) => estado.moverCampoImpresion)

  const [impresoras, setImpresoras] = useState<Impresora[]>([])
  const [guardando, setGuardando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  const canvasRegionRef = useRef<HTMLDivElement>(null)
  const [anchoContenedorPx, setAnchoContenedorPx] = useState(0)
  // null = "seguir el fit-to-width automático"; un número = zoom manual del
  // usuario, que ya no se toca al redimensionar (ver efecto de abajo, que
  // solo lo resetea si el fit automático lo supera).
  const [escalaManual, setEscalaManual] = useState<number | null>(null)

  useEffect(() => {
    const contenedor = canvasRegionRef.current
    if (!contenedor) return
    const observer = new ResizeObserver((entradas) => {
      const entrada = entradas[0]
      if (entrada) setAnchoContenedorPx(entrada.contentRect.width)
    })
    observer.observe(contenedor)
    return () => observer.disconnect()
  }, [])

  const escalaFit =
    anchoContenedorPx > 0
      ? clamp((anchoContenedorPx - ANCHO_REGLA_PX) / ANCHO_PAGINA_PT, ESCALA_MINIMA_ABSOLUTA, ESCALA_FIT_MAXIMA_ABSOLUTA)
      : ESCALA_FIT_MAXIMA_ABSOLUTA
  // Techo del zoom manual, relativo al fit vigente — se recalcula solo si
  // escalaFit cambia (resize), a diferencia del viejo ESCALA_MAXIMA fijo.
  const escalaMaxima = escalaFit * TECHO_ZOOM_RELATIVO
  // Derivado, no sincronizado vía efecto: si el contenedor creció (resize)
  // y el fit-to-width nuevo ya supera el zoom manual guardado, ese valor
  // quedó obsoleto como "más chico que el fit" y se ignora acá mismo — nunca
  // se muestra la página más chica que su piso, sin necesitar un useEffect
  // que llame setEscalaManual (dispara "set state in effect"). Math.min con
  // escalaMaxima por la misma razón: si escalaFit se achica (ventana más
  // angosta), el techo relativo baja con él, y un zoom manual viejo podría
  // quedar por encima del nuevo techo.
  const escala =
    escalaManual !== null && escalaManual >= escalaFit ? Math.min(escalaManual, escalaMaxima) : escalaFit

  // TODO(temporal): sacar una vez confirmado en vivo que el zoom arranca en
  // 100% — instrumentación para el reporte de que arrancaba en 197%. Si
  // "mount" no aparece con manual:null/pct:100, el problema está antes de
  // cualquier click; si aparece bien acá pero la UI igual muestra otra
  // cosa, el problema está en el render de ControlZoom, no en este estado.
  useEffect(() => {
    console.log('[ajuste-impresion] zoom', {
      anchoContenedorPx,
      escalaFit,
      escalaMaxima,
      escalaManual,
      escala,
      porcentaje: Math.round((escala / escalaFit) * 100),
    })
  }, [anchoContenedorPx, escalaFit, escalaMaxima, escalaManual, escala])

  function manejarAcercarZoom() {
    setEscalaManual(clamp(escala + escalaFit * PASO_ZOOM_RELATIVO, escalaFit, escalaMaxima))
  }

  function manejarAlejarZoom() {
    const nueva = escala - escalaFit * PASO_ZOOM_RELATIVO
    setEscalaManual(nueva <= escalaFit ? null : nueva)
  }

  function manejarResetZoom() {
    setEscalaManual(null)
  }

  // "Cargando" mientras la impresora activa todavía no tuvo sus defaults
  // resueltos NI UNA VEZ en esta sesión del wizard (impresorasConDefaultsCargados
  // vive en el store, no en estado local — así sobrevive a que este
  // componente se desmonte al navegar a otro paso y se remonte al volver).
  const cargandoDefaults = !!idImpresoraSeleccionada && !impresorasConDefaultsCargados[idImpresoraSeleccionada]
  const offsetsActivos = idImpresoraSeleccionada
    ? (offsetsImpresionPorImpresora[idImpresoraSeleccionada] ?? OFFSETS_VACIO)
    : OFFSETS_VACIO

  useEffect(() => {
    listarImpresoras().then(setImpresoras)
  }, [])

  // TODO(temporal): sacar junto con los console.log de manejarMoverCampos.
  useEffect(() => {
    console.log('[ajuste-impresion] offsetsImpresionPorImpresora cambió', offsetsImpresionPorImpresora)
  }, [offsetsImpresionPorImpresora])

  // Precarga los defaults guardados SOLO la primera vez que se selecciona
  // cada impresora en esta sesión (guardia: impresorasConDefaultsCargados).
  // Volver a seleccionar una impresora ya cargada NO repite el fetch ni pisa
  // los offsets de sesión — quedan los que ya había en
  // offsetsImpresionPorImpresora para esa impresora.
  useEffect(() => {
    if (!idImpresoraSeleccionada) return
    if (impresorasConDefaultsCargados[idImpresoraSeleccionada]) return
    let cancelado = false

    listarOverrides(idImpresoraSeleccionada, FORMULARIO).then((defaults) => {
      if (cancelado) return
      precargarDefaultsImpresora(idImpresoraSeleccionada, defaults)
    })

    return () => {
      cancelado = true
    }
  }, [idImpresoraSeleccionada, impresorasConDefaultsCargados, precargarDefaultsImpresora])

  // Memoizado: sin esto, CanvasFormulario recibiría un array nuevo en cada
  // render y su efecto de listeners de window (mousemove/mouseup) se
  // reengancharía constantemente (ver fix del error de React en
  // CanvasFormulario.tsx).
  const camposConPosicion = useMemo(() => {
    const prenda = mapWizardAPrendaParaImprimir({ titulares, vehiculo, financiera, contrato, deudoresSolidarios, garante })
    const camposBase = buildST02Fields(prenda).filter(
      (campo): campo is typeof campo & { id: string } => campo.pagina === 1 && !!campo.id
    )
    return aplicarOffsetsImpresion(camposBase, offsetsActivos)
  }, [titulares, vehiculo, financiera, contrato, deudoresSolidarios, garante, offsetsActivos])

  // Campos con el mismo `grupo` (ej. día/mes/año de una fecha) son un solo
  // dato lógico partido en varias casillas por el formulario físico — se
  // seleccionan y mueven siempre como unidad. Sin grupo, un campo es su
  // propio grupo de un solo elemento.
  const idsDelGrupo = useCallback(
    (id: string): string[] => {
      const campo = camposConPosicion.find((c) => c.id === id)
      if (!campo?.grupo) return [id]
      return camposConPosicion.filter((c) => c.grupo === campo.grupo).map((c) => c.id)
    },
    [camposConPosicion]
  )

  const manejarSeleccionarCampos = useCallback(
    (ids: string[], modo: ModoSeleccion) => {
      const idsExpandidos = ids.flatMap((id) => idsDelGrupo(id))
      setSeleccionados((actual) => {
        if (modo === 'reemplazar') return new Set(idsExpandidos)
        if (modo === 'agregar') return new Set([...actual, ...idsExpandidos])

        // toggle: shift-click sobre UN campo (posiblemente parte de un
        // grupo) — saca/agrega el grupo completo según el estado del campo
        // clickeado (el "ancla" del gesto, siempre ids[0] acá).
        const [idAncla] = ids
        const grupo = idsDelGrupo(idAncla)
        const nuevo = new Set(actual)
        if (nuevo.has(idAncla)) {
          for (const id of grupo) nuevo.delete(id)
        } else {
          for (const id of grupo) nuevo.add(id)
        }
        return nuevo
      })
    },
    [idsDelGrupo]
  )

  const manejarMoverCampos = useCallback(
    (deltaXpt: number, deltaYpt: number) => {
      // TODO(temporal): sacar estos console.log una vez confirmado en vivo
      // que el nudge mueve el canvas — instrumentación pedida para
      // diagnosticar si el corte está en el store o en el render.
      console.log('[ajuste-impresion] manejarMoverCampos', {
        idImpresoraSeleccionada,
        seleccionados: [...seleccionados],
        deltaXpt,
        deltaYpt,
      })
      if (!idImpresoraSeleccionada) {
        console.log('[ajuste-impresion] sin impresora seleccionada, no-op')
        return
      }
      for (const id of seleccionados) {
        moverCampoImpresion(idImpresoraSeleccionada, id, deltaXpt, deltaYpt)
      }
    },
    [idImpresoraSeleccionada, seleccionados, moverCampoImpresion]
  )

  const manejarNudge = useCallback(
    (deltaXmm: number, deltaYmm: number) => {
      if (seleccionados.size === 0) return
      manejarMoverCampos(mmAPuntos(deltaXmm), mmAPuntos(deltaYmm))
    },
    [seleccionados, manejarMoverCampos]
  )

  // Nudge con flechas del teclado, delta fijo (PASO_NUDGE_MM). Global a la ventana (no solo con foco en el
  // canvas): más simple que manejar tabIndex/foco en cada CampoCanvas, y acá
  // no hay otro control que use flechas salvo el <select>/<input> de
  // SelectorImpresora — se ignoran explícitamente para no robarles el foco.
  useEffect(() => {
    function manejarTeclado(evento: KeyboardEvent) {
      if (seleccionados.size === 0) return
      const objetivo = evento.target as HTMLElement
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(objetivo.tagName)) return

      const deltasMm: Partial<Record<string, [number, number]>> = {
        ArrowUp: [0, PASO_NUDGE_MM],
        ArrowDown: [0, -PASO_NUDGE_MM],
        ArrowLeft: [-PASO_NUDGE_MM, 0],
        ArrowRight: [PASO_NUDGE_MM, 0],
      }
      const delta = deltasMm[evento.key]
      if (!delta) return

      evento.preventDefault()
      manejarNudge(delta[0], delta[1])
    }

    window.addEventListener('keydown', manejarTeclado)
    return () => window.removeEventListener('keydown', manejarTeclado)
  }, [seleccionados, manejarNudge])

  async function manejarCrearImpresora(nombre: string) {
    const nueva = await crearImpresora(nombre)
    if (!nueva) return
    setImpresoras((actual) => [...actual, nueva])
    setImpresoraSeleccionada(nueva.id)
  }

  async function manejarGuardar() {
    if (!idImpresoraSeleccionada) return
    setGuardando(true)
    try {
      await guardarOverrides(idImpresoraSeleccionada, FORMULARIO, offsetsActivos)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className={claseCard}>
        <SelectorImpresora
          impresoras={impresoras}
          idSeleccionada={idImpresoraSeleccionada}
          onSeleccionar={setImpresoraSeleccionada}
          onCrear={manejarCrearImpresora}
        />
      </div>

      <div className={claseCard}>
        {/* Barra superior: solo Zoom (el paso del nudge ya no es elegible,
            ver PASO_NUDGE_MM). Sin columna derecha — el canvas de abajo usa
            todo el ancho de la tarjeta. */}
        <div className="mb-4 flex flex-wrap items-center gap-10">
          <ControlZoom
            porcentaje={Math.round((escala / escalaFit) * 100)}
            enMinimo={escala <= escalaFit}
            enMaximo={escala >= escalaMaxima}
            onAcercar={manejarAcercarZoom}
            onAlejar={manejarAlejarZoom}
            onReset={manejarResetZoom}
          />
        </div>

        {/* Wrapper NO scrolleable, solo para que el overlay de "sin
            impresora" tenga un contenedor de referencia que no se mueve.
            Antes el overlay era hijo directo de la región con scroll: un
            position:absolute adentro de un ancestro que scrollea NO se
            queda pegado al viewport visible, se queda anclado al punto
            donde estaba el contenido y se va scrolleando junto con él (por
            eso existe position:sticky — absolute solo no alcanza para esto).
            Resultado real: el overlay solo tapaba la porción de arriba;
            scrolleando hacia abajo, el resto del canvas quedaba sin
            cobertura (el bug del campo "34232" seleccionable). Con el
            overlay afuera de la región que scrollea, cubre siempre el
            viewport completo sin importar el scroll interno. */}
        <div className="relative">
          <div
            ref={canvasRegionRef}
            onDoubleClick={manejarResetZoom}
            // overflow-y-scroll (no overflow-y-auto): reserva el ancho del
            // scrollbar vertical SIEMPRE, haya o no contenido que lo
            // necesite. Sin esto, ResizeObserver mide un ancho más generoso
            // mientras no hace falta scroll vertical; en cuanto la hoja
            // crece lo suficiente como para necesitarlo, el scrollbar
            // aparece, el ancho disponible se achica, y lo que entraba justo
            // pasa a desbordar horizontalmente. overflow-x se queda en auto
            // a propósito: al 100% (fit-to-width) no debe verse ningún
            // scrollbar horizontal; aparece recién si el usuario acerca el
            // zoom a mano.
            className="overflow-x-auto overflow-y-scroll"
            style={{ maxHeight: '70vh' }}
            title="Doble click para volver al ajuste al ancho"
          >
            <CanvasFormulario
              formulario={FORMULARIO}
              tamanoPaginaPt={ST02_TAMANO_PAGINA}
              pxPorPunto={escala}
              campos={camposConPosicion}
              seleccionados={seleccionados}
              onSeleccionarCampos={manejarSeleccionarCampos}
              onMoverCampos={manejarMoverCampos}
            />
          </div>

          {!idImpresoraSeleccionada && (
            // Fondo/z-index en inline style (mismo motivo que ControlZoom):
            // el color con opacidad es justamente el tipo de utilidad que se
            // pierde si Tailwind no la generó a tiempo.
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10 }}
            >
              <p
                className="max-w-xs rounded-lg px-4 py-2 text-center text-sm font-medium text-white"
                style={{ backgroundColor: 'rgba(17,24,39,0.85)' }}
              >
                Seleccioná o creá una impresora para ajustar la impresión
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {cargandoDefaults && <p className="text-xs text-gray-400">Cargando ajustes guardados…</p>}
        <button
          type="button"
          onClick={manejarGuardar}
          disabled={!idImpresoraSeleccionada || guardando}
          className="ml-auto rounded-lg bg-[#1B4F8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#163f6e] disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar como ajuste de esta impresora'}
        </button>
      </div>
    </div>
  )
}
