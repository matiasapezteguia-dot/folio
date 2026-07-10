import type { AcreedorWizard, TipoPrenda } from '@/types'

export interface FinancieraOpcion {
  id: string
  nombre: string
  tipoPrenda: TipoPrenda
  acreedor: AcreedorWizard
}

// TODO: reemplazar por consulta a la tabla template_acreedor en Supabase.
const FINANCIERAS: FinancieraOpcion[] = [
  {
    id: 'fca-compania-financiera',
    nombre: 'FCA Compañía Financiera S.A.',
    tipoPrenda: 'compania_financiera',
    acreedor: {
      nombre: 'FCA COMPAÑÍA FINANCIERA S.A.',
      cuit: '30-69230488-4',
      calle: 'Av. Libertador',
      numero: '498',
      localidad: 'CABA',
      provincia: 'Buenos Aires',
      apoderado: 'Apoderado FCA Compañía Financiera',
    },
  },
  {
    id: 'fca-plan-ahorro',
    nombre: 'FCA S.A. de Ahorro para Fines Determinados',
    tipoPrenda: 'plan_ahorro',
    acreedor: {
      nombre: 'FCA S.A. DE AHORRO PARA FINES DETERMINADOS',
      cuit: '30-69223905-5',
      calle: 'Av. Libertador',
      numero: '498',
      localidad: 'CABA',
      provincia: 'Buenos Aires',
      apoderado: 'Apoderado FCA Plan de Ahorro',
    },
  },
]

export function listarFinancieras(): FinancieraOpcion[] {
  return FINANCIERAS
}

export function buscarFinancieraPorId(id: string): FinancieraOpcion | undefined {
  return FINANCIERAS.find((financiera) => financiera.id === id)
}
