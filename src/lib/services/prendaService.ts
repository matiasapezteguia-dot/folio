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
      telefono: '011-4344-5750',
      email: 'fcaplan.prendas@stellantis.com',
      calle: 'Av. Libertador',
      numero: '498',
      cp: '1001',
      localidad: 'CABA',
      personeriaOtorgadaPor: 'INSPECCION GENERAL DE JUSTICIA',
      inscripcionRegistral: 'N° 12044 - L°120. Tº A DE S. A.',
      fechaInscripcion: '02/12/1996',
    },
    deudores: [
      {
        nombreCompleto: 'PÉREZ, JUAN CARLOS',
        dni: '30123456',
        tipoDocumento: 'DNI',
        autoridadExpedidora: 'R.N.P.',
        nacionalidad: 'ARGENTINA',
        sexo: 'Masculino',
        profesion: 'EMPLEADO',
        telefono: '2284578333',
        email: 'juan.perez@gmail.com',
        calle: 'Av. San Martín',
        numero: '1234',
        localidad: 'Tandil',
        partido: 'Tandil',
        provincia: 'Buenos Aires',
        estadoCivil: 'casado',
        fechaNacimiento: '27/05/1982',
        numeroNupcias: '1',
        conyuge: 'PÉREZ, MARÍA JOSÉ',
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
