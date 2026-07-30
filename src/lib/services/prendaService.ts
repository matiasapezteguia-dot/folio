import type { DomicilioConstituido, PersonaParaImprimir, PrendaParaImprimir } from '@/types/pdf'
import type { PrendaDeudorSolidarioWizard, PrendaWizardPayload } from '@/types'
import { combinarPDFs, generarPDF } from '@/lib/pdf/engine'
import { CONTRATO_PAG1_TAMANO_PAGINA, buildContratoPag1Fields } from '@/lib/pdf/templates/contrato_fca_plan_ahorro_pag1'
import { CONTRATO_PAG2_TAMANO_PAGINA, buildContratoPag2Fields } from '@/lib/pdf/templates/contrato_fca_plan_ahorro_pag2'
import { HOJA_CONT1_TAMANO_PAGINA, buildHojaCont1Fields } from '@/lib/pdf/templates/contrato_hoja_cont1'
import { HOJA_CONT2_TAMANO_PAGINA, buildHojaCont2Fields } from '@/lib/pdf/templates/contrato_hoja_cont2'
import { HOJA_CONT3_TAMANO_PAGINA, buildHojaCont3Fields } from '@/lib/pdf/templates/contrato_hoja_cont3'
import {
  CONTRATO_FCA_CIA_FINANCIERA_PAG1_TAMANO_PAGINA,
  buildContratoFcaCiaFinancieraPag1Fields,
} from '@/lib/pdf/templates/contrato_fca_cia_financiera_pag1'
import {
  CONTRATO_FCA_CIA_FINANCIERA_PAG2_TAMANO_PAGINA,
  buildContratoFcaCiaFinancieraPag2Fields,
} from '@/lib/pdf/templates/contrato_fca_cia_financiera_pag2'
import {
  HOJA_CONT_CIA_FINANCIERA_1_TAMANO_PAGINA,
  buildHojaContCiaFinanciera1Fields,
} from '@/lib/pdf/templates/contrato_fca_cia_financiera_hoja_cont1'
import {
  HOJA_CONT_CIA_FINANCIERA_2_TAMANO_PAGINA,
  buildHojaContCiaFinanciera2Fields,
} from '@/lib/pdf/templates/contrato_fca_cia_financiera_hoja_cont2'
import {
  HOJA_CONT_CIA_FINANCIERA_3_TAMANO_PAGINA,
  buildHojaContCiaFinanciera3Fields,
} from '@/lib/pdf/templates/contrato_fca_cia_financiera_hoja_cont3'
import {
  HOJA_CONT_CIA_FINANCIERA_4_TAMANO_PAGINA,
  buildHojaContCiaFinanciera4Fields,
} from '@/lib/pdf/templates/contrato_fca_cia_financiera_hoja_cont4'

// Domicilio constituido fijo para trámites de FCA Plan de Ahorro.
// Confirmado por Mercedes (gestora, pilot user): este valor se usa siempre
// igual en todos los trámites de FCA Plan de Ahorro, independientemente
// del deudor. Origen probable: domicilio de FCA S.A. o del apoderado
// Carlos della Paolera - sin confirmar cuál de los dos exactamente.
// Autoforms NO autocompleta este dato (no hay lógica automática detrás);
// es un valor fijo conocido por el gestor y cargado manualmente.
// TODO: migrar a tabla template_acreedor (roadmap punto 8) cuando esté
// esa integración - este dato encaja naturalmente ahí junto con otros
// datos fijos por financiera/tipo de prenda (ej. leyenda de Cía Financiera).
const DOMICILIO_CONSTITUIDO_FCA_PLAN_AHORRO: DomicilioConstituido = {
  calle: 'Lima',
  numero: '365',
  piso: '3',
  depto: '3',
}

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

// Deudor solidario (Plan de Ahorro, DS1..DS4) o codeudor (Compañía
// Financiera, un único slot) — mismo mapeo para ambos, ver
// PrendaDeudorSolidarioWizard.
function mapDeudorSolidario(deudor: PrendaDeudorSolidarioWizard): PersonaParaImprimir {
  return {
    nombreCompleto: `${deudor.apellido}, ${deudor.nombre}`.toUpperCase(),
    dni: deudor.numeroDocumento || undefined,
    tipoDocumento: deudor.tipoDocumento || undefined,
    nacionalidad: deudor.nacionalidad || undefined,
    edad: deudor.edad || undefined,
    fechaNacimiento: deudor.fechaNacimiento || undefined,
    profesion: deudor.profesion || undefined,
    estadoCivil: deudor.estadoCivil || undefined,
    calle: deudor.calle || undefined,
    numero: deudor.numero || undefined,
    piso: deudor.piso || undefined,
    depto: deudor.depto || undefined,
    localidad: deudor.localidad || undefined,
    cp: deudor.cp || undefined,
  }
}

// Traduce el estado en memoria del wizard de carga (src/app/(dashboard)/prendas/nueva/)
// a la vista aplanada que consume el template ST-03. No persiste nada en Supabase.
export function mapWizardAPrendaParaImprimir(wizard: PrendaWizardPayload): PrendaParaImprimir {
  const { titulares, vehiculo, financiera, contrato, deudoresSolidarios, garante } = wizard

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
      edad: titular.edad || undefined,
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
      condicion: vehiculo.condicion || undefined,
      uso: vehiculo.uso || undefined,
    },
    // ModalidadesContrato.concepto solo distingue saldo_precio/prestamo (uso
    // en ST-03 y en la excepción de asentimiento conyugal); "préstamo con
    // garantía recíproca" se trata como préstamo a estos efectos.
    modalidades: contrato.concepto
      ? { concepto: contrato.concepto === 'saldo_precio' ? 'saldo_precio' : 'prestamo' }
      : undefined,
    deudoresSolidarios:
      (deudoresSolidarios ?? []).length > 0 ? deudoresSolidarios.map(mapDeudorSolidario) : undefined,
    garante: garante
      ? {
          nombre: garante.nombre.toUpperCase(),
          dni: garante.dni || undefined,
          domicilio: garante.domicilio || undefined,
        }
      : undefined,
    domicilioConstituido:
      financiera.tipoPrenda === 'plan_ahorro' ? DOMICILIO_CONSTITUIDO_FCA_PLAN_AHORRO : undefined,
  }
}

// DNTR Título I, Cap. I, Sección 5ª: el asentimiento conyugal se exige
// cuando el deudor está casado (Art. 1º.1), SALVO que el contrato sea en
// concepto de saldo de precio (Art. 2º.1) — excepción expresa del Digesto.
// Mientras no se sepa el concepto (contrato.concepto sin elegir todavía en
// el wizard) se asume que corresponde, para no omitir por defecto un
// documento legalmente exigible.
//
// TODO: falta el criterio de "bien ganancial" (Art. 470 CCC inciso a exige
// asentimiento solo sobre bienes GANANCIALES, no propios) — PrendaParaImprimir
// no modela el régimen patrimonial del matrimonio todavía, solo estadoCivil.
// Tampoco están modeladas las demás excepciones del Art. 2º (ambos cónyuges
// copropietarios/codeudores, garante/avalista, orden judicial, bien no
// registrable).
function requiereAsentimientoConyugal(
  solicitante: PersonaParaImprimir | undefined,
  concepto: 'saldo_precio' | 'prestamo' | undefined
): boolean {
  return solicitante?.estadoCivil === 'casado' && concepto !== 'saldo_precio'
}

// Deudor solidario (Plan de Ahorro) o codeudor (Compañía Financiera) — mismo
// campo (deudoresSolidarios) para ambos, ver mapDeudorSolidario().
function tieneDeudorSolidario(prenda: PrendaParaImprimir): boolean {
  return (prenda.deudoresSolidarios?.length ?? 0) > 0
}

// El DNTR exige regímenes de copias distintos para el contrato (original +
// 1 copia no negociable) y las hojas de continuación (por duplicado) — por
// eso se generan como dos PDFs independientes en vez de uno solo. Cada
// función arma su documento llamando generarPDF() por página/hoja y
// concatenando con combinarPDFs() (ambos en lib/pdf/engine.ts, agnósticos
// de dominio); la decisión de qué hoja corresponde vive acá, no en
// route.ts ni en los templates.

// Contrato Plan de Ahorro: página 1 siempre + página 2 (deudores
// solidarios) solo si hay al menos uno cargado.
export async function buildContratoPlanAhorroDocumento(prenda: PrendaParaImprimir): Promise<Uint8Array> {
  const pdfs = [await generarPDF(buildContratoPag1Fields(prenda), CONTRATO_PAG1_TAMANO_PAGINA, 1)]

  if (tieneDeudorSolidario(prenda)) {
    pdfs.push(await generarPDF(buildContratoPag2Fields(prenda), CONTRATO_PAG2_TAMANO_PAGINA, 1))
  }

  return combinarPDFs(pdfs)
}

// Hojas de continuación Plan de Ahorro: hoja 1 (descripción del bien) y hoja
// 2 (garante -punto 15°-, domicilios constituidos -punto 16°- y cláusulas
// finales) siempre — son las dos caras físicas de una misma hoja de
// continuación oficial, no una hoja "del garante" a incluir condicionalmente.
// Cuando no hay garante real cargado, buildHojaCont2Fields ya completa el
// punto 15° con los datos del propio deudor (comportamiento confirmado:
// Autoforms/el operador nunca lo deja en blanco). Hoja 3 (asentimiento
// conyugal) sí es condicional, solo si corresponde.
export async function buildHojasContinuacionPlanAhorroDocumento(prenda: PrendaParaImprimir): Promise<Uint8Array> {
  const pdfs = [
    await generarPDF(buildHojaCont1Fields(prenda), HOJA_CONT1_TAMANO_PAGINA, 1),
    await generarPDF(buildHojaCont2Fields(prenda), HOJA_CONT2_TAMANO_PAGINA, 1),
  ]

  if (requiereAsentimientoConyugal(prenda.deudores[0], prenda.modalidades?.concepto)) {
    pdfs.push(await generarPDF(buildHojaCont3Fields(prenda), HOJA_CONT3_TAMANO_PAGINA, 1))
  }

  return combinarPDFs(pdfs)
}

// Contrato Compañía Financiera: página 1 siempre + página 2 (codeudor)
// solo si hay uno cargado (único slot calibrado en el template — ver
// contrato_fca_cia_financiera_pag2.ts).
export async function buildContratoCiaFinancieraDocumento(prenda: PrendaParaImprimir): Promise<Uint8Array> {
  const pdfs = [
    await generarPDF(
      buildContratoFcaCiaFinancieraPag1Fields(prenda),
      CONTRATO_FCA_CIA_FINANCIERA_PAG1_TAMANO_PAGINA,
      1
    ),
  ]

  if (tieneDeudorSolidario(prenda)) {
    pdfs.push(
      await generarPDF(
        buildContratoFcaCiaFinancieraPag2Fields(prenda),
        CONTRATO_FCA_CIA_FINANCIERA_PAG2_TAMANO_PAGINA,
        1
      )
    )
  }

  return combinarPDFs(pdfs)
}

// Hojas de continuación Compañía Financiera: página 1 y 2 siempre (base
// fija del formulario — domicilio legal, etc., sin condicional confirmada
// todavía). Hoja 3 y 4 son la misma hoja "extra" genérica repetida (ver
// contrato_fca_cia_financiera_hoja_cont3.ts) que Autoforms agrega para
// codeudor/garante adicional — se incluyen solo si hay codeudor cargado.
// El criterio exacto de cuántas hojas extra hacen falta no está calibrado
// contra un PDF real todavía; se incluyen ambas (3 y 4) como aproximación
// hasta confirmarlo.
export async function buildHojasContinuacionCiaFinancieraDocumento(prenda: PrendaParaImprimir): Promise<Uint8Array> {
  const pdfs = [
    await generarPDF(buildHojaContCiaFinanciera1Fields(prenda), HOJA_CONT_CIA_FINANCIERA_1_TAMANO_PAGINA, 1),
    await generarPDF(buildHojaContCiaFinanciera2Fields(prenda), HOJA_CONT_CIA_FINANCIERA_2_TAMANO_PAGINA, 1),
  ]

  if (tieneDeudorSolidario(prenda)) {
    pdfs.push(await generarPDF(buildHojaContCiaFinanciera3Fields(prenda), HOJA_CONT_CIA_FINANCIERA_3_TAMANO_PAGINA, 1))
    pdfs.push(await generarPDF(buildHojaContCiaFinanciera4Fields(prenda), HOJA_CONT_CIA_FINANCIERA_4_TAMANO_PAGINA, 1))
  }

  return combinarPDFs(pdfs)
}
