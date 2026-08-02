import type { EstadoCivilWizard, TitularWizard } from '@/types'

export type DatosAfip = Pick<
  TitularWizard,
  | 'nombre'
  | 'apellido'
  | 'nacionalidad'
  | 'estadoCivil'
  | 'profesion'
  | 'calle'
  | 'numero'
  | 'localidad'
  | 'provincia'
>

const RETARDO_SIMULADO_MS = 600

// TODO: reemplazar por integración real con AFIP/ARCA (lookup por CUIT/DNI).
export async function buscarPersonaPorCuitDni(cuitDni: string): Promise<DatosAfip | null> {
  await new Promise((resolve) => setTimeout(resolve, RETARDO_SIMULADO_MS))

  const limpio = cuitDni.replace(/\D/g, '')
  if (!limpio) return null

  const estadoCivil: EstadoCivilWizard = 'soltero'

  return {
    nombre: 'Juan Carlos',
    apellido: 'Pérez',
    nacionalidad: 'Argentina',
    estadoCivil,
    profesion: 'Comerciante',
    calle: 'Av. San Martín',
    numero: '1234',
    localidad: 'Tandil',
    provincia: 'Buenos Aires',
  }
}
