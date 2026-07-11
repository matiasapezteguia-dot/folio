// Formato "D de mes de AAAA" en español, usado por el contrato FCA plan de
// ahorro y sus hojas de continuación (confirmado contra los PDFs de datos
// reales). Los overlays de Autoforms muestran el mes en inglés (ej. "1 de
// June de 2026") — es un bug del sistema que lo generó, no el formato
// pretendido para un contrato en español, así que acá se corrige a español.
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export interface FechaLarga {
  dia: string
  mesTexto: string
  anio: string
}

export function formatearFechaLarga(fecha?: string): FechaLarga {
  if (!fecha) return { dia: '', mesTexto: '', anio: '' }

  const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const [, anio, mes, dia] = iso
    return { dia: String(Number(dia)), mesTexto: MESES[Number(mes) - 1] ?? '', anio }
  }

  const conBarras = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (conBarras) {
    const [, dia, mes, anio] = conBarras
    return { dia: String(Number(dia)), mesTexto: MESES[Number(mes) - 1] ?? '', anio }
  }

  return { dia: '', mesTexto: '', anio: '' }
}
