import type { PersonaParaImprimir, PrendaParaImprimir } from '@/types/pdf'
import type { PrendaWizardPayload } from '@/types'

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

function separarCuitDni(valor: string): Pick<PersonaParaImprimir, 'cuit' | 'dni' | 'tipoDocumento'> {
  const limpio = valor.replace(/\D/g, '')

  if (limpio.length === 11) {
    return { cuit: `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}` }
  }
  if (limpio.length > 0) {
    return { dni: limpio, tipoDocumento: 'DNI' }
  }
  return {}
}

// Traduce el estado en memoria del wizard de carga (src/app/(dashboard)/prendas/nueva/)
// a la vista aplanada que consume el template ST-03. No persiste nada en Supabase.
export function mapWizardAPrendaParaImprimir(wizard: PrendaWizardPayload): PrendaParaImprimir {
  const { titulares, vehiculo, financiera, contrato } = wizard

  return {
    id: 'wizard',
    contrato: {
      fecha: new Date().toISOString().slice(0, 10),
      lugar: contrato.lugarPago || undefined,
      monto: Number(contrato.monto) || undefined,
      cantidadCuotas: Number(contrato.cantidadCuotas) || undefined,
      importeCuota: Number(contrato.importeCuota) || undefined,
    },
    acreedor: {
      nombreCompleto: financiera.acreedor?.nombre ?? financiera.nombreFinanciera,
      cuit: financiera.acreedor?.cuit,
      calle: financiera.acreedor?.calle,
      numero: financiera.acreedor?.numero,
      localidad: financiera.acreedor?.localidad,
      provincia: financiera.acreedor?.provincia,
    },
    deudores: titulares.map((titular) => ({
      nombreCompleto: `${titular.apellido}, ${titular.nombre}`.toUpperCase(),
      ...separarCuitDni(titular.cuitDni),
      nacionalidad: titular.nacionalidad || undefined,
      profesion: titular.profesion || undefined,
      estadoCivil: titular.estadoCivil || undefined,
      conyuge: titular.estadoCivil === 'casado' ? titular.conyuge || undefined : undefined,
      telefono: titular.telefono || undefined,
      email: titular.email || undefined,
      calle: titular.calle || undefined,
      numero: titular.numero || undefined,
      localidad: titular.localidad || undefined,
      provincia: titular.provincia || undefined,
    })),
    vehiculo: {
      marca: vehiculo.marca || undefined,
      modelo: vehiculo.modelo || undefined,
      tipo: vehiculo.tipo || undefined,
      patente: vehiculo.patente || undefined,
      numeroMotor: vehiculo.numeroMotor || undefined,
      numeroChasis: vehiculo.numeroChasis || undefined,
      marcaMotor: vehiculo.marcaMotor || undefined,
      marcaChasis: vehiculo.marcaChasis || undefined,
    },
  }
}
