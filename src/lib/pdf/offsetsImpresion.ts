import type { CampoPDF } from '@/types/pdf'

// Offset aditivo de un campo (CampoPDF.id) para el paso "ajuste-impresion" —
// se suma a x/y base del template, nunca las reemplaza (ver
// scripts/referencias/campo_override.sql). Tipo único: lo comparten el store
// del wizard, campoOverrideService.ts y esta función, para que los tres
// hablen del mismo shape.
export interface OffsetCampo {
  offsetX: number
  offsetY: number
}

// Único punto que suma offsets de impresión a coordenadas base de un
// CampoPDF. Lo usan tanto el editor visual (PasoAjusteImpresion.tsx, para su
// propio render) como la generación real del PDF (api/pdf/st03/route.ts),
// para que ambos calculen exactamente la misma posición final — antes cada
// uno tenía su propia copia de esta lógica y solo el editor la aplicaba.
export function aplicarOffsetsImpresion<T extends CampoPDF>(
  campos: T[],
  offsets: Record<string, OffsetCampo> | undefined
): T[] {
  if (!offsets || Object.keys(offsets).length === 0) return campos

  return campos.map((campo) => {
    const offset = campo.id ? offsets[campo.id] : undefined
    if (!offset) return campo
    return { ...campo, x: campo.x + offset.offsetX, y: campo.y + offset.offsetY }
  })
}
