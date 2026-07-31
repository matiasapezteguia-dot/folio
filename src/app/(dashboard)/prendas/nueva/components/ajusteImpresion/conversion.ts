// Conversión puntos PDF <-> mm, ver CLAUDE.md ("1 punto = 0.352mm").
export const MM_POR_PUNTO = 0.352

export function puntosAMm(puntos: number): number {
  return puntos * MM_POR_PUNTO
}

export function mmAPuntos(mm: number): number {
  return mm / MM_POR_PUNTO
}
