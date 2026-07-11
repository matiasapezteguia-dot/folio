import type { CampoPDF, PrendaParaImprimir } from '@/types/pdf'

// Tamaño de página oficial del contrato FCA plan de ahorro (Legal, 612×1008pt).
export const CONTRATO_PAG2_TAMANO_PAGINA: [number, number] = [612, 1008]
export const CONTRATO_PAG2_CANTIDAD_PAGINAS = 1

// contrato_pag2_datos_reales.pdf vino vacío (870 bytes, sin texto) en la
// muestra disponible: el trámite de referencia no tenía deudores solidarios.
// El PDF de campos sí muestra 4 bloques (DS1-DS4, uno por deudor solidario:
// apellido, estado civil, profesión, nacionalidad, edad, domicilio en 2
// líneas y N° de documento) + ApoderadoAcr + OtrasAnot + Obs, pero ninguno
// tiene evidencia real todavía — todo queda comentado hasta calibrar contra
// un trámite con al menos un deudor solidario.
//
// La decisión de si esta página corresponde o no es una regla de negocio
// (según CLAUDE.md: "asentimiento conyugal, hoja continuación... viven en
// services/, nunca en templates/") — este archivo solo sabe posicionar
// texto; quien lo llama decide si hay deudores solidarios (data.deudores[1..])
// y si corresponde generarla.
export function buildContratoPag2Fields(_data: PrendaParaImprimir): CampoPDF[] {
  return [
    // Sin evidencia real todavía (posiciones conocidas por el PDF de campos,
    // un bloque por cada deudor solidario, deudores[1] a deudores[4]):
    // { texto: '', x: 149.52, y: 870.72, size: 9, pagina: 1 }, // ApelDS1
    // { texto: '', x: 126.72, y: 861.72, size: 9, pagina: 1 }, // ECivilDS1
    // { texto: '', x: 201.72, y: 861.72, size: 9, pagina: 1 }, // ProfesionDS1
    // { texto: '', x: 132.72, y: 852.12, size: 9, pagina: 1 }, // NacDS1
    // { texto: '', x: 201.72, y: 852.12, size: 9, pagina: 1 }, // EdadDS1
    // { texto: '', x: 121.92, y: 842.52, size: 9, pagina: 1 }, // Domic1DS1
    // { texto: '', x: 87.72,  y: 833.52, size: 9, pagina: 1 }, // Domic2DS1
    // { texto: '', x: 133.92, y: 824.52, size: 9, pagina: 1 }, // NroDocDS1
    //
    // { texto: '', x: 349.92, y: 870.72, size: 9, pagina: 1 }, // ApelDS3
    // { texto: '', x: 329.52, y: 861.72, size: 9, pagina: 1 }, // ECivilDS3
    // { texto: '', x: 403.92, y: 861.72, size: 9, pagina: 1 }, // ProfesionDS3
    // { texto: '', x: 333.12, y: 852.12, size: 9, pagina: 1 }, // NacDS3
    // { texto: '', x: 403.92, y: 852.12, size: 9, pagina: 1 }, // EdadDS3
    // { texto: '', x: 322.32, y: 842.52, size: 9, pagina: 1 }, // Domic1DS3
    // { texto: '', x: 288.12, y: 833.52, size: 9, pagina: 1 }, // Domic2DS3
    // { texto: '', x: 334.32, y: 824.52, size: 9, pagina: 1 }, // NroDocDS3
    //
    // { texto: '', x: 149.52, y: 801.72, size: 9, pagina: 1 }, // ApelDS2
    // { texto: '', x: 129.72, y: 792.72, size: 9, pagina: 1 }, // ECivilDS2
    // { texto: '', x: 201.72, y: 792.72, size: 9, pagina: 1 }, // ProfesionDS2
    // { texto: '', x: 132.72, y: 783.72, size: 9, pagina: 1 }, // NacDS2
    // { texto: '', x: 201.72, y: 783.72, size: 9, pagina: 1 }, // EdadDS2
    // { texto: '', x: 121.92, y: 775.32, size: 9, pagina: 1 }, // Domic1DS2
    // { texto: '', x: 87.72,  y: 765.72, size: 9, pagina: 1 }, // Domic2DS2
    // { texto: '', x: 134.52, y: 756.72, size: 9, pagina: 1 }, // NroDocDS2
    //
    // { texto: '', x: 349.92, y: 801.72, size: 9, pagina: 1 }, // ApelDS4
    // { texto: '', x: 329.52, y: 792.72, size: 9, pagina: 1 }, // ECivilDS4
    // { texto: '', x: 403.92, y: 792.72, size: 9, pagina: 1 }, // ProfesionDS4
    // { texto: '', x: 333.12, y: 783.72, size: 9, pagina: 1 }, // NacDS4
    // { texto: '', x: 403.92, y: 783.72, size: 9, pagina: 1 }, // EdadDS4
    // { texto: '', x: 322.32, y: 775.32, size: 9, pagina: 1 }, // Domic1DS4
    // { texto: '', x: 288.12, y: 765.72, size: 9, pagina: 1 }, // Domic2DS4
    // { texto: '', x: 334.32, y: 756.72, size: 9, pagina: 1 }, // NroDocDS4
    //
    // { texto: '', x: 213.12, y: 743.52, size: 9, pagina: 1 }, // Obs
    // { texto: '', x: 172.92, y: 498.72, size: 9, pagina: 1 }, // ApoderadoAcr
    // { texto: '', x: 178.32, y: 374.16, size: 9, pagina: 1 }, // OtrasAnot
  ]
}
