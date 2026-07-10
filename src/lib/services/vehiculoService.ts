import { createClient } from '@/lib/supabase/client'
import type { MarcaVehiculo, ModeloVehiculo, ModeloVehiculoTipo } from '@/types'

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
