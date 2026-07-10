export function claseInput(invalido: boolean): string {
  return [
    'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/40 focus:border-[#1B4F8A]',
    invalido ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
  ].join(' ')
}

export const claseLabel = 'mb-1 block text-sm font-medium text-gray-700'
export const claseError = 'mt-1 text-xs text-red-600'
export const claseCard = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'
