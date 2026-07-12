# FOLIO — Contexto del Proyecto

## Qué es
Sistema web/mobile para gestores y mandatarios del automotor en Argentina.
Automatiza la confección e impresión de trámites registrales sobre formularios 
oficiales preimpresos de la DNRPA.

Compite con Autoforms (Morisco, Tandil) — software de escritorio Windows, 
modelo de cobro por volumen, operación unipersonal, sin versión web/mobile.

## Stack
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Base de datos: PostgreSQL vía Supabase con RLS
- Auth: Supabase Auth
- Generación de PDF: pdf-lib (posicionamiento absoluto X/Y sobre formulario preimpreso)
- State management: Zustand
- Hosting: Vercel

## Referencia técnica del desarrollador
Experiencia con este stack exacto — construyó FinanSaaS con Next.js + Supabase + 
Zustand + Sentry, incluyendo RLS, soft delete, actualizaciones optimistas y 
build de producción.

---

## Objetivo inmediato — MVP
Generar los formularios de una prenda FCA (Compañía Financiera y Plan de Ahorro):
- Contrato prendario (ST-03 de la DNRPA)
- Solicitud Tipo 02 (certificado de dominio)
- Contrato prendario de la financiera (FCA Plan de Ahorro / FCA Compañía Financiera)

---

## Lo que NO está en scope del MVP
- Transferencia ST-08
- OCR de DNI o título del vehículo (Fase 3)
- Integración UIF automática (Fase 2)
- App nativa iOS/Android (Fase 4)
- Agente IA para formularios nuevos (Fase 4)

---

## Base de datos — Schema implementado en Supabase

### RLS
- **SELECT público:** persona, marca_vehiculo, modelo_vehiculo, modelo_vehiculo_tipo,
  tipo_formulario, template_acreedor, uva
- **Privado por usuario:** tramite, prenda, formulario, contrato, domicilio y relacionadas

### Tablas principales
- domicilio, persona, persona_apoderado, persona_propietario, persona_pep, persona_sujeto_obligado
- marca_vehiculo, modelo_vehiculo, modelo_vehiculo_tipo (3.193 marcas, 47.289 modelos, 51.335 tipos — fuente DNRPA)
- especificacion_vehiculo, forma_adquisicion
- tramite, tramite_titular (máx 4, con % y orden)
- contrato, tasas_penalidades_seguros, costo_financiero_total, uva
- prenda, prenda_deudor (máx 4, con tipo y orden)
- formulario, formulario_03, formulario_prenda, template_acreedor
- impresora (id, id_usuario, nombre, offset_x, offset_y)

---

## Arquitectura de generación de PDF

### Regla crítica
Las coordenadas X/Y de cada campo se obtienen EXCLUSIVAMENTE de los PDFs de 
referencia en scripts/referencias/ usando scripts/extraerCoordenadas.ts.
Nunca se inventan coordenadas.

Conversión: y_pdflib = 1008 - y_autoforms (página Legal = 612×1008pt)

### Separación de responsabilidades
- engine.ts — motor genérico, crea página Legal en blanco, posiciona campos
- templates/*.ts — coordenadas y lógica de cada formulario
- services/prendaService.ts — lógica de negocio, arma PrendaParaImprimir
- route.ts — orquesta: service → template → engine → response

### Templates calibrados
Todos calibrados contra PDFs de referencia en scripts/referencias/:

| Template | Estado | Notas |
|---|---|---|
| st03.ts | ✅ 45 campos verificados | Página Legal 612×1008pt |
| st02.ts | ✅ Página 1 calibrada | Página 2 la completa el registro |
| contrato_fca_plan_ahorro_pag1.ts | ✅ 13 campos | |
| contrato_fca_plan_ahorro_pag2.ts | ⚠️ Slots DS1-DS4 sin muestra real | |
| contrato_hoja_cont1.ts | ✅ 8/11 campos | |
| contrato_hoja_cont2.ts | ⚠️ 6/29 campos, sin garante en muestra | |
| contrato_hoja_cont3.ts | ⚠️ 4 campos, falta paragraph wrapping | |
| contrato_fca_cia_financiera_pag1.ts | ✅ Completo | |
| contrato_fca_cia_financiera_pag2.ts | ⚠️ Sin evidencia en muestra | |
| hojas_continuacion_pagina1/2/3.ts | ✅ Calibradas | |
| hoja_continuacion4.ts | ✅ Mismas coords que pag3 | |

⚠️ IMPORTANTE: Las hojas de continuación de Compañía Financiera tienen 
formularios físicos DISTINTOS a las de Plan de Ahorro — coordenadas no 
compartibles entre ambas.

---

## Lógica de negocio clave

### Asentimiento conyugal
Aplica cuando: deudor casado + bien ganancial + concepto = PRÉSTAMO
NO aplica cuando: concepto = saldo de precio (DNTR Título I Cap.I Sección 5ª Art. 2.1)
ni cuando ambos cónyuges son copropietarios/codeudores, orden judicial, etc.
Texto generado: "{apellido_conyuge}, D.N.I. {dni_conyuge}, en mi carácter de 
cónyuge de {apellido_deudor}, D.N.I.: {dni_deudor} doy mi expreso asentimiento 
conyugal en los términos del art. 470 del Código Civil y Comercial para que mi 
nombrado cónyuge, grave con derecho real de prenda, el automotor objeto del 
presente contrato."

### Hoja de continuación
Se genera cuando no alcanza el espacio del formulario físico para los datos.
El disparador práctico ">1 deudor o apoderado" es consecuencia del formulario,
no un mandato del DNTR.

### Condominio
Si hay más de 1 titular, los datos del condómino van al campo Obs como texto
generado — el formulario físico solo tiene campos fijos para 1 titular.

### Deudores solidarios
- Plan de Ahorro: máx 4 (slots DS1-DS4 en pag2)
- Compañía Financiera: máx 1 calibrado (si hay más, no bloquear — recalibrar)
- Garante en Plan de Ahorro → hoja_cont2

### Límites de titulares/deudores
El tope de 4 es práctica registral (capacidad del formulario físico), 
no un mandato legal.

---

## Financieras relevadas
- FCA S.A. de Ahorro para Fines Determinados — CUIT 30-69223905-5
- FCA Compañía Financiera S.A. — CUIT 30-69230488-4
- Banco Santander Argentina S.A. — CUIT 30-50000845-4

Apoderados en: scripts/referencias/apoderados_financieras.json

---

## Frontend implementado

### Auth
- Login/logout con Supabase Auth
- middleware.ts protege todas las rutas excepto /login

### Sidebar
- Color #1B4F8A
- Menú: Inicio, Nueva Prenda, Trámites, Impresoras

### Wizard 5 pasos en /prendas/nueva/
- Paso 1: Titular/es (hasta 4, %, apoderado, email/teléfono obligatorios DNTR,
  estado civil default soltero)
- Paso 2: Vehículo (combobox cascada marca→modelo→tipo desde Supabase,
  autocompletar marca motor/chasis, patente deshabilitada en 0km,
  condición default 0km, uso default particular)
- Paso 3: Financiera (FCA Plan Ahorro, FCA Compañía Financiera)
- Paso 4: Contrato (monto, cuotas default 18, sugerencia importe=monto÷cuotas,
  lugar celebración separado de lugar pago, clase FIJA/FLOTANTE, moneda,
  concepto saldo_precio/prestamo, tasas, cotización BNA si USD)
- Paso 5: Revisión + descarga PDF (ST-03, ST-02, Contrato activos)

### Store
hooks/usePrendaWizard.ts con Zustand

### API endpoints
- GET/POST /api/pdf/st03
- POST /api/pdf/st02
- POST /api/pdf/contrato-plan-ahorro
- POST /api/pdf/contrato-cia-financiera

---

## PDFs de precarga de financieras

FCA envía al gestor un PDF con datos precargados del contrato.

### Campos en el PDF de FCA Plan de Ahorro
- Referencia interna: SOL-XXXXX-XXXXXX
- Monto en números y letras
- Datos del deudor: nombre, estado civil, profesión, nacionalidad, edad, domicilio
- Datos del vehículo: marca, tipo, modelo, motor, chasis, condición, uso
- Datos financieros: cuotas, importe, fecha primera cuota, capital, tasa mora
- TEA/CFT: 0% en plan de ahorro

### Campos que NO vienen (se obtienen de AFIP)
- DNI, CUIT/CUIL, fecha de nacimiento

### Archivos de referencia
- scripts/referencias/fca_plan_ahorro_ejemplo1.pdf (LAVACARA JOSE LUIS)
- scripts/referencias/fca_plan_ahorro_ejemplo2.pdf (CAGIONI ROBERTO PABLO)

---

## Integraciones externas

| API | Uso | Fase |
|---|---|---|
| AFIP/ARCA | Lookup CUIT/DNI → datos persona | MVP (mock actual) |
| Claude API | Extracción de datos de PDF de financiera | Fase 2 |
| API UIF | Chequeo sujetos obligados | Fase 2 |

---

## Modelo de impresión

Pantalla de selección de campos antes de imprimir:
- El gestor elige qué campos/grupos imprimir por formulario
- Todo desmarcable individualmente (resuelve caso de datos precargados en papel)
- Preferencias guardadas por financiera+tipo_prenda

Impresoras con offset X/Y:
- Tabla impresora (id, id_usuario, nombre, offset_x, offset_y)
- Prueba de impresión con grilla de referencia para calibrar
- Múltiples impresoras por usuario

Editor visual (Fase 2):
- Formulario escaneado de fondo + datos arrastrables
- Overrides por formulario+impresora

---

## Roadmap técnico

### Completado ✅
- Schema Supabase completo con RLS
- Tipos TypeScript (src/types/index.ts y src/types/pdf.ts)
- Arquitectura PDF (engine + templates + services + routes)
- Auth (login/logout/middleware)
- Sidebar con navegación
- Wizard 5 pasos con validaciones completas
- ST-03 con 45 coordenadas verificadas
- ST-02 página 1 calibrada
- Contrato FCA Plan de Ahorro (5 páginas calibradas)
- Contrato FCA Compañía Financiera (6 páginas calibradas)
- 3.193 marcas y 47.289 modelos DNRPA importados
- Combobox cascada marca→modelo→tipo

### Pendientes inmediatos

**1. Desdoblar generación de contrato en dos documentos**
El DNTR exige regímenes de copias distintos:
- Contrato (pag1+pag2): original + 1 copia no negociable
- Hojas de continuación: por duplicado
Dividir buildContratoParaImprimir() en dos funciones, dos endpoints, dos botones en Paso 5.

**2. Agregar paso de deudores solidarios al wizard**
Post financiera, pre Paso 4. Campos según tipo:
- Plan de Ahorro / deudor solidario (máx 4) → slots DS1-DS4
- Plan de Ahorro / garante → hoja_cont2
- Compañía Financiera / codeudor (máx 1 calibrado)

**3. Test overflow deudores en Autoforms**
Pendiente: cargar 6 deudores solidarios (plan ahorro) y 3 codeudores 
(compañía financiera) para ver cómo Autoforms resuelve el overflow.
Ver: test_deudores_solidarios_autoforms.md

**4. Pantalla de selección de campos a imprimir**
Antes de generar PDFs, el gestor elige qué campos imprimir.
Preferencias guardadas por financiera+tipo_prenda.

**5. Configuración de impresoras**
Pantalla /impresoras con offset X/Y por usuario y prueba de impresión.

**6. Conectar prendaService a Supabase**
Reemplazar datos hardcodeados, guardar tramite/prenda/contrato real.

**7. Historial de trámites (/tramites)**
Listado con estado, fecha, dominio, financiera, botón reimprimir.

**8. Prueba con Mercedes ← HITO CLAVE**
Validar flujo completo antes de seguir construyendo.

### Fase 2 (post-Mercedes)
- Extractor PDF de financiera (Claude API)
- Template de acreedor con leyenda parametrizada
- Integración AFIP/ARCA real
- Gestión de impresoras con editor visual
- Sección UIF

### Fases 3-4
- OCR foto DNI / título del vehículo
- Agente IA para formularios nuevos
- App nativa iOS/Android
- ST-08 (transferencia)

---

## Gaps pendientes de investigar
- DNTR específico de automotores no disponible (el repo tiene solo Título I de 
  bienes muebles no registrables) — confirmar citas de asentimiento conyugal y 
  hoja de continuación para automotores
- Compañía Financiera: ¿se da asentimiento conyugal en la práctica? Consultar a Mercedes
- Hoja cont 3 de compañía financiera: párrafo libre requiere paragraph wrapping 
  en engine.ts (no implementado aún)