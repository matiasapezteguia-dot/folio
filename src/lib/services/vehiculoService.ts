import { createClient } from '@/lib/supabase/client'
import type { MarcaVehiculo, ModeloVehiculo, ModeloVehiculoTipo } from '@/types'

export interface ModeloVehiculoConMarca {
  modelo: ModeloVehiculo
  marca: MarcaVehiculo
}

// Tope de resultados de la búsqueda inversa (por nombre de modelo, sin marca
// todavía) — mismo valor que maxOpcionesVisibles por default en
// ComboboxBuscable, no tiene sentido traer más de lo que el combobox va a
// mostrar.
const LIMITE_BUSQUEDA_MODELO = 50

export async function listarMarcasVehiculo(): Promise<MarcaVehiculo[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('marca_vehiculo')
      .select('*')
      .is('fecha_baja', null)
      .order('nombre')

    if (error) throw error
    return data ?? []
  } catch (err) {
    const error = err as Error
    console.error('Error al listar marcas de vehículo:', error.message)
    return []
  }
}

export async function listarModelosPorMarca(idMarca: string): Promise<ModeloVehiculo[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('modelo_vehiculo')
      .select('*')
      .eq('id_marca', idMarca)
      .is('fecha_baja', null)
      .order('nombre')

    if (error) throw error
    return data ?? []
  } catch (err) {
    const error = err as Error
    console.error('Error al listar modelos de vehículo:', error.message)
    return []
  }
}

// Búsqueda inversa: modelo → marca, para cuando el gestor tipea el modelo
// antes que la marca (Paso2Vehiculo.tsx). Devuelve cada fila de
// modelo_vehiculo junto con su marca_vehiculo asociada (vía id_marca) — el
// mismo nombre de modelo puede existir en más de una marca como filas
// distintas (cada combinación marca+modelo es una fila propia con su propio
// id), por eso el resultado siempre trae la marca junto con cada coincidencia
// en vez de devolver un modelo "genérico" ambiguo.
export async function buscarModelosPorNombre(query: string): Promise<ModeloVehiculoConMarca[]> {
  const texto = query.trim()
  if (!texto) return []

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('modelo_vehiculo')
      .select('*, marca_vehiculo(*)')
      .ilike('nombre', `%${texto}%`)
      .is('fecha_baja', null)
      .order('nombre')
      .limit(LIMITE_BUSQUEDA_MODELO)

    if (error) throw error

    return (data ?? [])
      .filter((fila) => !!fila.marca_vehiculo)
      .map((fila) => {
        const { marca_vehiculo, ...modelo } = fila
        return { modelo, marca: marca_vehiculo }
      })
  } catch (err) {
    const error = err as Error
    console.error('Error al buscar modelos de vehículo por nombre:', error.message)
    return []
  }
}

export async function listarTiposPorModelo(idModelo: string): Promise<ModeloVehiculoTipo[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('modelo_vehiculo_tipo')
      .select('*')
      .eq('id_modelo', idModelo)
      .is('fecha_baja', null)
      .order('descripcion_tipo')

    if (error) throw error
    return data ?? []
  } catch (err) {
    const error = err as Error
    console.error('Error al listar tipos de vehículo:', error.message)
    return []
  }
}
