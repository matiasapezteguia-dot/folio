export function formatMoneda(monto: number): string {
  const formateado = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto)

  return `$${formateado}`
}
