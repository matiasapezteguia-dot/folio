import type { ApoderadoWizard } from '@/types'

export type ApoderadoGuardado = ApoderadoWizard

const RETARDO_SIMULADO_MS = 400

// Simula la tabla persona_apoderado, indexada por CUIT/DNI del titular.
const APODERADOS_POR_PERSONA: Record<string, ApoderadoGuardado[]> = {
  '20123456789': [
    {
      id: 'apoderado-mock-1',
      nombreApellido: 'GÓMEZ, MARÍA LAURA',
      tipoDocumento: 'DNI',
      numeroDocumento: '28456123',
      tipoPoder: 'escritura_publica',
      datosPoder: 'Escritura N° 145, Folio 320, 12/03/2024, Esc. Roberto Díaz',
    },
  ],
}

// TODO: reemplazar por consulta real a persona_apoderado en Supabase (join por CUIT/DNI de persona).
export async function listarApoderadosPorPersona(cuitDni: string): Promise<ApoderadoGuardado[]> {
  await new Promise((resolve) => setTimeout(resolve, RETARDO_SIMULADO_MS))

  const limpio = cuitDni.replace(/\D/g, '')
  if (!limpio) return []

  return APODERADOS_POR_PERSONA[limpio] ?? []
}
