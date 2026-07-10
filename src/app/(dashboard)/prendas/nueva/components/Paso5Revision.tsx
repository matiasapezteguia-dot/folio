'use client'

import { useState } from 'react'
import { usePrendaWizard } from '../hooks/usePrendaWizard'
import { claseCard } from '../estilos'
import { formatMoneda } from '@/lib/utils/formatMoneda'
import { numeroALetras } from '@/lib/utils/numeroALetras'
import type { TipoPrenda } from '@/types'

interface Paso5RevisionProps {
  onVolverAEditar: () => void
}

interface DocumentoWizard {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
}

function documentosPorTipoPrenda(tipoPrenda: TipoPrenda | ''): DocumentoWizard[] {
  const st03: DocumentoWizard = {
    id: 'st03',
    nombre: 'Solicitud Tipo 03',
    descripcion: 'Inscripción de la prenda ante el Registro Nacional de la Propiedad Automotor.',
    activo: true,
  }
  const st02: DocumentoWizard = {
    id: 'st02',
    nombre: 'Solicitud Tipo 02',
    descripcion: 'Certificado de estado de dominio del vehículo.',
    activo: false,
  }

  if (tipoPrenda === 'compania_financiera') {
    return [
      {
        id: 'contrato-compania-financiera',
        nombre: 'Contrato Prendario (financiera)',
        descripcion: 'Contrato de prenda con la compañía financiera.',
        activo: false,
      },
      st03,
      st02,
    ]
  }

  if (tipoPrenda === 'plan_ahorro') {
    return [
      {
        id: 'contrato-plan-ahorro',
        nombre: 'Contrato Prendario (plan de ahorro)',
        descripcion: 'Contrato de prenda del plan de ahorro.',
        activo: false,
      },
      {
        id: 'anexo-clausulas-especiales',
        nombre: 'Anexo de Cláusulas Especiales',
        descripcion: 'Cláusulas particulares del plan de ahorro.',
        activo: false,
      },
      st03,
      st02,
    ]
  }

  return []
}

function nombreArchivoST03(dominio: string): string {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  const dominioLimpio = dominio.trim().toUpperCase() || 'SIN-DOMINIO'

  return `ST03_${dominioLimpio}_${anio}${mes}${dia}.pdf`
}

interface DocumentoCardProps {
  documento: DocumentoWizard
  cargando: boolean
  onDescargar: () => void
}

function DocumentoCard({ documento, cargando, onDescargar }: DocumentoCardProps) {
  return (
    <div className={`${claseCard} flex items-center justify-between gap-4`}>
      <div>
        <p className="text-sm font-semibold text-gray-900">{documento.nombre}</p>
        <p className="mt-0.5 text-xs text-gray-500">{documento.descripcion}</p>
      </div>
      {documento.activo ? (
        <button
          type="button"
          onClick={onDescargar}
          disabled={cargando}
          className="whitespace-nowrap rounded-lg bg-[#1B4F8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#163f6e] disabled:opacity-50"
        >
          {cargando ? 'Generando…' : 'Descargar PDF'}
        </button>
      ) : (
        <button
          type="button"
          disabled
          title="En desarrollo"
          className="whitespace-nowrap cursor-not-allowed rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400"
        >
          Próximamente
        </button>
      )}
    </div>
  )
}

function FilaDato({ etiqueta, valor }: { etiqueta: string; valor?: string | number }) {
  if (valor === undefined || valor === '') return null
  return (
    <div className="flex justify-between border-b border-gray-100 py-1.5 text-sm last:border-0">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="font-medium text-gray-900">{valor}</span>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-gray-200 bg-white" open>
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-semibold text-gray-900">
        {titulo}
        <span className="text-gray-400 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-gray-100 px-5 py-3">{children}</div>
    </details>
  )
}

export default function Paso5Revision({ onVolverAEditar }: Paso5RevisionProps) {
  const titulares = usePrendaWizard((estado) => estado.titulares)
  const vehiculo = usePrendaWizard((estado) => estado.vehiculo)
  const financiera = usePrendaWizard((estado) => estado.financiera)
  const contrato = usePrendaWizard((estado) => estado.contrato)

  const [cargandoId, setCargandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function manejarDescargarST03() {
    setCargandoId('st03')
    setError(null)
    try {
      const respuesta = await fetch('/api/pdf/st03', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulares, vehiculo, financiera, contrato }),
      })

      if (!respuesta.ok) {
        throw new Error('No se pudo generar el PDF')
      }

      const blob = await respuesta.blob()
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = nombreArchivoST03(vehiculo.patente)
      document.body.appendChild(enlace)
      enlace.click()
      document.body.removeChild(enlace)
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido al generar el PDF'
      setError(mensaje)
    } finally {
      setCargandoId(null)
    }
  }

  const documentos = documentosPorTipoPrenda(financiera.tipoPrenda)

  const montoNumerico = Number(contrato.monto)
  const importeCuotaNumerico = Number(contrato.importeCuota)

  return (
    <div className="space-y-4">
      <Seccion titulo={`Titular/es (${titulares.length})`}>
        <div className="space-y-4">
          {titulares.map((titular, indice) => (
            <div key={titular.id}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {indice === 0 ? 'Titular' : `Co-titular ${indice + 1}`}
                {titulares.length >= 2 ? ` — ${titular.porcentaje}%` : ''}
              </p>
              <FilaDato etiqueta="CUIT/DNI" valor={titular.cuitDni} />
              <FilaDato etiqueta="Nombre y apellido" valor={`${titular.nombre} ${titular.apellido}`} />
              <FilaDato etiqueta="Nacionalidad" valor={titular.nacionalidad} />
              <FilaDato etiqueta="Edad" valor={titular.edad} />
              <FilaDato etiqueta="Estado civil" valor={titular.estadoCivil} />
              {titular.estadoCivil === 'casado' && <FilaDato etiqueta="Cónyuge" valor={titular.conyuge} />}
              <FilaDato etiqueta="Profesión" valor={titular.profesion} />
              <FilaDato etiqueta="Teléfono" valor={titular.telefono} />
              <FilaDato etiqueta="Email" valor={titular.email} />
              <FilaDato
                etiqueta="Domicilio"
                valor={`${titular.calle} ${titular.numero}, ${titular.localidad}, ${titular.provincia}`}
              />
              {titular.actuaMedianteApoderado && titular.apoderado && (
                <>
                  <FilaDato etiqueta="Apoderado" valor={titular.apoderado.nombreApellido} />
                  <FilaDato
                    etiqueta="Documento del apoderado"
                    valor={`${titular.apoderado.tipoDocumento} ${titular.apoderado.numeroDocumento}`}
                  />
                  <FilaDato
                    etiqueta="Tipo de poder"
                    valor={
                      titular.apoderado.tipoPoder === 'escritura_publica'
                        ? 'Escritura pública'
                        : 'Carta poder'
                    }
                  />
                  <FilaDato etiqueta="Datos del poder" valor={titular.apoderado.datosPoder} />
                </>
              )}
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Vehículo">
        <FilaDato etiqueta="Marca" valor={vehiculo.marca} />
        <FilaDato etiqueta="Tipo" valor={vehiculo.tipo} />
        <FilaDato etiqueta="Modelo" valor={vehiculo.modelo} />
        <FilaDato etiqueta="Marca motor" valor={vehiculo.marcaMotor} />
        <FilaDato etiqueta="N° motor" valor={vehiculo.numeroMotor} />
        <FilaDato etiqueta="Marca chasis" valor={vehiculo.marcaChasis} />
        <FilaDato etiqueta="N° chasis" valor={vehiculo.numeroChasis} />
        <FilaDato etiqueta="Condición" valor={vehiculo.condicion} />
        <FilaDato etiqueta="Uso" valor={vehiculo.uso} />
        <FilaDato etiqueta="Color" valor={vehiculo.color} />
        <FilaDato etiqueta="Dominio/patente" valor={vehiculo.patente} />
      </Seccion>

      <Seccion titulo="Financiera">
        <FilaDato etiqueta="Financiera" valor={financiera.nombreFinanciera} />
        <FilaDato etiqueta="Tipo de prenda" valor={financiera.tipoPrenda} />
        {financiera.acreedor && (
          <>
            <FilaDato etiqueta="CUIT acreedor" valor={financiera.acreedor.cuit} />
            <FilaDato etiqueta="Apoderado" valor={financiera.acreedor.apoderado} />
          </>
        )}
      </Seccion>

      <Seccion titulo="Contrato">
        <FilaDato etiqueta="Clase" valor={contrato.clase} />
        <FilaDato etiqueta="Moneda" valor={contrato.moneda === 'usd' ? 'USD' : 'Pesos'} />
        {contrato.moneda === 'usd' && (
          <FilaDato etiqueta="Cotización BNA tipo vendedor" valor={contrato.cotizacionBna} />
        )}
        <FilaDato etiqueta="Monto" valor={montoNumerico > 0 ? formatMoneda(montoNumerico) : undefined} />
        <FilaDato
          etiqueta="Monto en letras"
          valor={montoNumerico > 0 ? numeroALetras(montoNumerico) : undefined}
        />
        <FilaDato etiqueta="Cantidad de cuotas" valor={contrato.cantidadCuotas} />
        <FilaDato
          etiqueta="Importe por cuota"
          valor={importeCuotaNumerico > 0 ? formatMoneda(importeCuotaNumerico) : undefined}
        />
        <FilaDato etiqueta="Fecha primera cuota" valor={contrato.fechaPrimeraCuota} />
        <FilaDato etiqueta="Lugar de pago" valor={contrato.lugarPago} />
        <FilaDato etiqueta="Tasa de mora anual" valor={`${contrato.tasaMoraAnual}%`} />
        <FilaDato etiqueta="TEA" valor={`${contrato.tea || '0'}%`} />
        <FilaDato
          etiqueta="Seguro"
          valor={contrato.seguro.enTramite ? 'En trámite' : contrato.seguro.compania}
        />
        <FilaDato
          etiqueta="Privilegios preexistentes"
          valor={contrato.privilegiosPreexistentes === 'ninguno' ? 'Ninguno' : contrato.privilegiosTexto}
        />
      </Seccion>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Documentos para imprimir</h3>
        <div className="space-y-3">
          {documentos.map((documento) => (
            <DocumentoCard
              key={documento.id}
              documento={documento}
              cargando={cargandoId === documento.id}
              onDescargar={documento.id === 'st03' ? manejarDescargarST03 : () => {}}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={onVolverAEditar}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Volver a editar
        </button>
      </div>
    </div>
  )
}
