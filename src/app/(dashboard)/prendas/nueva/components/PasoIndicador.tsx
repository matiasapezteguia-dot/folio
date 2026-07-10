interface PasoIndicadorProps {
  pasoActual: number
  titulos: string[]
}

export default function PasoIndicador({ pasoActual, titulos }: PasoIndicadorProps) {
  return (
    <ol className="flex items-start">
      {titulos.map((titulo, indice) => {
        const numeroPaso = indice + 1
        const completado = numeroPaso < pasoActual
        const activo = numeroPaso === pasoActual
        const esUltimo = indice === titulos.length - 1

        return (
          <li key={titulo} className={esUltimo ? 'flex items-center' : 'flex flex-1 items-center'}>
            <div className="flex flex-col items-center">
              <div
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  completado
                    ? 'bg-emerald-500 text-white'
                    : activo
                      ? 'bg-[#1B4F8A] text-white'
                      : 'bg-gray-100 text-gray-400',
                ].join(' ')}
              >
                {completado ? '✓' : numeroPaso}
              </div>
              <span
                className={[
                  'mt-2 whitespace-nowrap text-xs font-medium',
                  activo ? 'text-[#1B4F8A]' : completado ? 'text-emerald-600' : 'text-gray-400',
                ].join(' ')}
              >
                {titulo}
              </span>
            </div>
            {!esUltimo && (
              <div
                className={['mx-2 mb-5 h-0.5 flex-1', completado ? 'bg-emerald-500' : 'bg-gray-200'].join(
                  ' '
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
