# Folio — Instrucciones para Claude Code

## Stack
Next.js 15 App Router + TypeScript + Supabase + pdf-lib + Tailwind + Zustand

## Convenciones
- Nombres de variables y funciones en español (coincide con el dominio)
- Nombres de archivos y carpetas en inglés (convención Next.js)
- Siempre tipar explícitamente, nunca usar `any`
- Imports absolutos con @/ siempre
- Componentes: PascalCase. Funciones: camelCase

## Estructura
- src/lib/services/ → lógica de negocio y Supabase
- src/lib/pdf/ → motor de generación de PDF
- src/lib/pdf/templates/ → un archivo por formulario
- src/types/ → todos los tipos en index.ts y pdf.ts
- src/components/ → componentes reutilizables
- src/app/(dashboard)/ → rutas protegidas

## Reglas importantes
- Nunca poner lógica de negocio en route.ts
- Nunca poner queries de Supabase fuera de services/
- Siempre manejar errores con try/catch y tipar el error
- RLS está activo — todas las queries necesitan usuario autenticado
- Soft delete: usar fecha_baja en lugar de DELETE

## Base de datos
- Cliente browser: import { createClient } from '@/lib/supabase/client'
- Cliente server: import { createClient } from '@/lib/supabase/server'
- Nunca usar el cliente browser en Server Components o API routes

## PDF
- engine.ts es agnóstico de dominio — no importar tipos de negocio
- Cada formulario tiene su propio template en /templates/
- Coordenadas en puntos PDF (1 punto = 0.352mm)
- Origen (0,0) en esquina inferior izquierda, Y crece hacia arriba
- Los templates NO usan un PDF de fondo: generan páginas en blanco del
  tamaño oficial del formulario (ver ST03_TAMANO_PAGINA), para imprimir
  sobre el papel físico del formulario oficial.

### ST-03: los PDFs de referencia son la fuente de verdad absoluta
Los PDFs en `scripts/referencias/st03_pagina1_datos_reales.pdf` y
`st03_pagina2_datos_reales.pdf` (overlays reales generados por Autoforms
sobre el formulario físico) son la única fuente de verdad para:
- Formato de cada campo (2 dígitos vs 4, con/sin `$`, separadores de miles, espaciado tras `:`)
- Coordenadas X/Y exactas y tamaño de fuente
- Qué campos se imprimen y cuáles no
- Orden y posición de cada elemento

El formulario físico (su estructura de secciones y labels) sirve solo
para entender el significado de cada campo — nunca para inferir formato
o coordenadas. Ante cualquier ajuste a `st03.ts`, extraer las coordenadas
con `scripts/extraerCoordenadas.ts` y verificarlas contra esos PDFs antes
de darlas por buenas.

## Visión de escalabilidad — regla permanente

El sistema aspira a cubrir absolutamente todos los formularios 
registrales de automotores y motovehículos de Argentina.

### Reglas de diseño para escalabilidad

**Formularios:**
- Cada formulario es un archivo en src/lib/pdf/templates/
- Nunca hardcodear lógica de un formulario específico en engine.ts
- engine.ts es agnóstico — recibe campos + tamaño de página, nada más
- Agregar un formulario nuevo = agregar un archivo en templates/ + 
  coordenadas. Sin tocar nada más.

**Financieras:**
- Los datos fijos de cada financiera viven en la tabla template_acreedor
- Los templates de texto parametrizado viven en template_acreedor.texto_documentacion
- Agregar una financiera nueva = insertar registro en Supabase. Sin código nuevo.

**Tipos de trámite:**
- La tabla tipo_formulario es el catálogo
- Cada trámite nuevo = nuevo template en /templates/ + registro en tipo_formulario
- La UI debe poder listar dinámicamente los trámites disponibles 
  desde tipo_formulario, no desde constantes hardcodeadas

**Lógica condicional:**
- Las reglas de negocio (asentimiento conyugal, hoja continuación, 
  condominio → Obs) viven en services/, nunca en templates/ ni en route.ts
- Un template solo sabe de coordenadas y formato — nunca de reglas de negocio

**Base de datos:**
- Soft delete siempre (fecha_baja) — nunca DELETE físico
- RLS en todas las tablas
- Auditoría completa en todos los registros

**API:**
- Una route por formulario en /api/pdf/
- Una route por extractor en /api/extract/
- Los services son los únicos que hablan con Supabase