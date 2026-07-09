import type { PrendaParaImprimir } from '@/types/pdf'

// TODO: reemplazar por consulta a Supabase (prenda + contrato + deudores +
// acreedor_prendario + especificacion_vehiculo) una vez definido el mapeo
// de PrendaCompleta -> PrendaParaImprimir.
export async function getPrendaParaImprimir(prendaId: string): Promise<PrendaParaImprimir> {
  return {
    id: prendaId,
    contrato: {
      lugar: 'Tandil',
      fecha: '09/07/2026',
      monto: 4500000,
      cantidadCuotas: 24,
      importeCuota: 187500,
      grado: 1,
    },
    acreedor: {
      nombreCompleto: 'FCA COMPAÑÍA FINANCIERA S.A.',
      cuit: '30-69230488-4',
      domicilio: 'Av. Libertador 498, CABA',
    },
    deudores: [
      {
        nombreCompleto: 'PÉREZ, JUAN CARLOS',
        dni: '30123456',
        domicilio: 'Av. San Martín 1234, Tandil',
        estadoCivil: 'casado',
      },
    ],
    vehiculo: {
      marca: 'VOLKSWAGEN',
      modelo: 'GOL TREND',
      tipo: 'SEDAN 5 PUERTAS',
      patente: 'AB123CD',
      numeroMotor: 'ABC123456',
      numeroChasis: '9BWZZZ377VT004251',
      marcaMotor: 'VOLKSWAGEN',
      marcaChasis: 'VOLKSWAGEN',
    },
  }
}
