# FOLIO — Contexto del Proyecto

## Qué es
Sistema web/mobile para gestores y mandatarios del automotor en Argentina.
Automatiza la confección e impresión de trámites registrales sobre formularios 
oficiales preimpresos de la DNRPA (Dirección Nacional del Registro de la 
Propiedad del Automotor).

Compite con Autoforms (Morisco, Tandil) — software de escritorio Windows, 
modelo de cobro por volumen, operación unipersonal, sin versión web/mobile.

## Stack
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Base de datos: PostgreSQL vía Supabase con RLS
- Auth: Supabase Auth
- Generación de PDF: pdf-lib (posicionamiento absoluto X/Y sobre formulario preimpreso)
- State management: Zustand con actualizaciones optimistas
- Hosting: Vercel


## Estructura del proyecto
src/
app/          # App Router de Next.js
lib/
supabase/
client.ts # createBrowserClient
server.ts # createServerClient
types/
index.ts    # Todos los tipos TypeScript del modelo de datos
components/
store/        # Zustand

## Referencia técnica del desarrollador
El desarrollador tiene experiencia con este stack exacto — construyó FinanSaaS,
un sistema de finanzas dual-currency con Next.js + Supabase + Zustand + Sentry,
incluyendo RLS, soft delete, actualizaciones optimistas y build de producción.

---

## Objetivo inmediato — MVP
Generar los formularios de una prenda FCA (Compañía Financiera y Plan de Ahorro):
- Contrato prendario (formulario físico ST-03 de la DNRPA)
- Solicitud Tipo 02 (certificado de dominio)
- Formulario 03 complementario

El sistema toma los datos del gestor, los posiciona en coordenadas X/Y exactas
sobre el PDF del formulario oficial preimpreso, y genera un PDF listo para imprimir.

## Lo que NO está en scope del MVP
- Transferencia ST-08 (se ataca después de resolver prendas)
- OCR de DNI o título del vehículo (Fase 3)
- Integración UIF automática (Fase 2)
- App nativa iOS/Android (Fase 4)
- Agente IA para interpretar formularios nuevos (Fase 4)

## Integraciones externas planificadas

| API | Uso | Fase |
|---|---|---|
| AFIP/ARCA | Lookup CUIT/DNI → datos persona | MVP |
| Claude API | Extracción de datos de PDF de financiera | Fase 2 |
| API UIF (sroapi.uif.gob.ar) | Chequeo sujetos obligados | Fase 2 |
| DNRPA marcas/modelos | Catálogo de vehículos actualizado | MVP/Fase 1 |

## Modelo de impresión

Cada usuario configura sus impresoras con offset X/Y calibrado mediante 
prueba de impresión. El sistema aplica el offset al generar el PDF final.
El formulario oficial escaneado (PNG 300DPI) se usa como fondo de referencia
para el editor visual y para el preview de impresión.

Entidad `impresora`: id, id_usuario, nombre, offset_x, offset_y

## Editor visual de impresión (Fase 2)
Pantalla con formulario escaneado de fondo + datos superpuestos arrastrables.
El gestor puede mover grupos de datos y seleccionar qué secciones imprimir.
Coordenadas guardadas como overrides por formulario + impresora.

---

## Base de datos — Schema implementado en Supabase

### Tablas base (sin dependencias)
- `domicilio` — direcciones reutilizables
- `marca_vehiculo` — marcas de autos y motores
- `modelo_vehiculo` — modelos de vehículos
- `tipo_vehiculo` — tipos (sedan, pickup, furgón, etc.)
- `tipo_formulario` — catálogo de formularios (02, 03, prenda, 08)

### Persona
- `persona` — unificada humana/jurídica con campo `tipo`
- `persona_apoderado` — relación persona → apoderado
- `persona_propietario` — beneficiarios finales de personas jurídicas
- `persona_pep` — personas expuestas políticamente
- `persona_sujeto_obligado` — sujetos obligados UIF

### Vehículo y adquisición
- `especificacion_vehiculo` — datos técnicos del vehículo
- `forma_adquisicion` — datos de la compra (factura, valor, forma)

### Trámite
- `tramite` — entidad raíz que agrupa todo
- `tramite_titular` — titulares del vehículo (máx. 4, con % y orden)

### Prenda
- `contrato` — condiciones financieras (cuotas, montos, vencimientos)
- `tasas_penalidades_seguros` — TNA, TEA, TEM, punitorios, seguros
- `costo_financiero_total` — CFT, CFTEA con/sin IVA
- `uva` — valores UVA para prendas ajustables
- `prenda` — contrato prendario (FK a tramite, acreedor, contrato, tasas)
- `prenda_deudor` — deudores solidarios/garantes (máx. 4, con tipo y orden)

### Formularios (patrón herencia)
- `formulario` — tabla base con id_tramite, tipo, url_pdf, estado
- `formulario_03` — campos específicos del ST-03 (rubro H/I, grado, concepto)
- `formulario_prenda` — genérico para todas las financieras (tipo + template)
- `template_acreedor` — templates de texto parametrizado por financiera

### RLS implementado
- **Compartido (SELECT público):** `persona`, `marca_vehiculo`, `modelo_vehiculo`, 
  `tipo_vehiculo`, `tipo_formulario`, `template_acreedor`, `uva`
- **Privado por usuario:** `tramite`, `prenda`, `formulario`, `contrato`, 
  `domicilio` y todas las tablas relacionadas

---

## Tipos TypeScript
Implementados en `src/types/index.ts`. Incluye:
- Tipos primitivos: `TipoPersona`, `EstadoCivil`, `TipoPrenda`, `TipoDeudor`, etc.
- Interfaces por entidad: `Persona`, `Tramite`, `Prenda`, `Formulario`, etc.
- Tipos compuestos con joins: `TramiteCompleto`, `PrendaCompleta`, `FormularioCompleto`
- Interface base `Auditoria` con fecha_creacion, fecha_modificacion, fecha_baja, id_usuario

---

## Modelo de datos — decisiones clave

### Persona compartida
`persona` es pública para SELECT (cualquier gestor puede buscar por CUIT).
Los trámites son privados por usuario. Esto replica la "base colaborativa" de 
Autoforms sin exponer la cartera de clientes de cada gestor.

### Formularios con herencia
`formulario` es la tabla base. `formulario_03` y `formulario_prenda` la extienden
con campos específicos (relación 1:1 por id_formulario). Agregar un nuevo 
formulario = agregar una nueva tabla hija, sin modificar la base.

### Template de texto parametrizado
Las leyendas de compañía financiera (ej: "24 cuotas de $X...") se generan
inyectando valores del contrato en un template guardado en `template_acreedor`.
Plan de ahorro: el texto viene preimpreso en el papel, el sistema no lo genera.

### Formulario prenda genérico
`formulario_prenda` tiene campo `tipo` (compania_financiera/plan_ahorro) en lugar
de una tabla por financiera. Escala a cualquier acreedor sin agregar tablas nuevas.

---

## Lógica de negocio clave

- Asentimiento conyugal obligatorio si deudor casado + bien ganancial (Art. 470 CCC)
- Hoja continuación si hay más de 1 deudor o apoderado (DNTR)
- Monto en números debe coincidir con monto en letras — validación bloqueante
- Concordancia absoluta chasis/motor con documentación original
- Espacios en blanco deben cerrarse con líneas
- Sesión única simultánea por cuenta (anti-sharing)
- Máximo 4 titulares por trámite (constraint DB)
- Máximo 4 deudores por prenda (constraint DB)

---

## Financieras relevadas con formularios reales
- Banco Santander Argentina S.A. — CUIT 30-50000845-4
- FCA Compañía Financiera S.A. — CUIT 30-69230488-4
- FCA S.A. de Ahorro para Fines Determinados — CUIT 30-69223905-5

---

## Primeros prompts sugeridos para Claude Code

### 1. Store de Zustand
"Leé el CONTEXT.md y src/types/index.ts. Armá el store de Zustand en 
src/store/index.ts con estado inicial para tramite, prenda y persona, 
siguiendo patrón de actualizaciones optimistas con Supabase."

### 2. Middleware de auth
"Creá el middleware de autenticación en middleware.ts que proteja todas 
las rutas excepto /login, usando Supabase Auth con App Router."

### 3. Primera pantalla
"Creá la pantalla de listado de trámites en src/app/(dashboard)/tramites/page.tsx
que consulte la tabla tramite de Supabase con RLS, mostrando estado, fecha y 
vehículo asociado."

### 4. Formulario de nueva prenda
"Creá el formulario de carga de nueva prenda en varias etapas:
1. Búsqueda de persona por CUIT (consulta Supabase, si no existe ofrece crear)
2. Datos del vehículo
3. Selección de financiera y tipo de prenda
4. Datos del contrato (cuotas, montos, tasas)"

### 5. Generación de PDF
"Implementá la función de generación de PDF con pdf-lib en src/lib/pdf/prenda.ts
que tome un objeto PrendaCompleta y genere el PDF con posicionamiento absoluto
sobre el template del formulario oficial ST-03."


## Hallazgos técnicos clave — análisis del Drive

### Arquitectura de generación de PDF
Los formularios de Autoforms son AcroForm PDFs con campos nombrados.
El sistema inyecta valores por nombre de campo, no por coordenadas X/Y.
Con pdf-lib esto se implementa así:
```typescript
const form = pdfDoc.getForm()
form.getTextField('ApelDeudor1').setText('DOUCEDE, LUCAS EZEQUIEL')
form.getTextField('CuitDeudor').setText('23295336269')
form.getCheckBox('CasadoDeudor').check()
```

### Lógica de condominio
Los campos AcroForm tienen posiciones fijas para el caso estándar (1 titular).
Cuando hay condominio, los datos adicionales van al campo `Obs` como texto generado.
No hay campos fijos para el segundo titular en el formulario — es lógica condicional
del motor de generación.

### Asentimiento conyugal — texto parametrizado
Se genera automáticamente cuando estado_civil = casado. Template:
"{apellido_conyuge}, D.N.I. {dni_conyuge}, en mi carácter de cónyuge de 
{apellido_deudor}, D.N.I.: {dni_deudor} doy mi expreso asentimiento conyugal 
en los términos del art. 470 del Código Civil y Comercial para que mi nombrado 
cónyuge, grave con derecho real de prenda, el automotor objeto del presente contrato."
Va en la Hoja de Continuación 3.

### Mapa de campos por formulario

#### ST-03 Página 1 (campos AcroForm)
Contrato: AnoContrato, MesContrato, DiaContrato, MontoContrato, Patente
Acreedor: CUITAcr, ApelAcreedor1/2/3, ProfesionmailAcr, TEAcr,
  CalleAcreedor, NumeroAcreedor, PisoAcreedor, DepAcreedor, CodigoAcreedor,
  LocalidadAcreedor, PartidoAcreedor, PciaAcreedor,
  DNIAcreedor, LEAcreedor, LCAcreedor, DNIEAcreedor, CIAcreedor, PasapAcreedor,
  NroDocAcreedor, AutoridadAcreedor,
  DiaNacAcr, MesNacAcr, AnoNacAcr,
  SolteroAcreedor, CasadoAcreedor, ViudoAcreedor, DivorcAcreedor, NupciaAcreedor,
  ConyugeAcr, PersoneriaAcreedor,
  InscripcionPersoneriaAcreedor1/2, DiaInscrAcr, MesInscrAcr, AnoInscrAcr,
  NroInscrAnt
Deudor: CuitDeudor, ApelDeudor1/2/3, TEDeudor, emailDeudor,
  Nacionalidad, ProfesionDeudor,
  CalleDeudor, NumeroDeudor, PisoDeudor, DepDeudor, CodigoDeudor, BarrioDeudor,
  LocalidadDeudor, PartidoDeudor, PciaDeudor,
  DNIDeudor, LEDeudor, LCDeudor, DNIEDeudor, CIDeudor, PasapDeudor,
  NroDocDeudor, AutoridadDeudor,
  DiaNacTit, MesNacTit, AnoNacTit,
  SolteroDeudor, CasadoDeudor, ViudoDeudor, DivorcDeudor, NupciaDeudor,
  ConyugeDeudor, PersoneriaDeudor,
  InscripcionDeudor1/2, DiaInscrTit, MesInscrTit, AnoInscrTit
Vehículo: Patente2Marca, Tipo, Modelo, MarcaMotor, NroMotor, MarcaChasis, NroChasis
Modalidades: ClausulaSI, ClausulaNO, Grado, SaldoPrecio, Prestamo, HSI, HNO
Condómino: MemoCondomino (texto generado para Obs cuando hay condominio)

#### ST-03 Página 2 (campos AcroForm)
Autorizo, Calle, TDocNro, Dia, Mes, Ano, Numero,
DiaCancel, AnoCancel, Traslado, TrasladoAno, TrasladoLeyenda,
PagueseA, Domicilio, Leyenda, TrasladoMes

#### ST-02 Página 1
Patente, Patente2, Solicitante, Apoderado,
DNI, DNIE, CI, LE, LC, Pasap, NroDoc, Autoridad,
Tipo, Fecha, Marca, Modelo, MarcaMotor, NroMotor, MarcaChasis, NroChasis
Opción D: siempre opción 5 (Certificado de Estado de Dominio) para prendas

#### ST-02 Página 2
Solicitante, DiaOrdena, MesOrdena, AnoOrdena,
DiaLevanta, MesLevanta, AnoLevanta, Condomino,
Juzgado, Secretaria, DNI, LC, LE, DNIE, CI, Pasap,
NroDoc, Autoridad, Personeria, NroInscr,
DiaInscrTit, MesInscrTit, AnoInscrTit, Obs, Autorizo, TDocNro

#### Contrato Página 1 (Plan de Ahorro)
LugaryFecha, NacionalidadDeudor, AnoP, Ciudad, Calle, Tipo, Uso,
pcia, dto, Cuartel, NombreEst, ECivilDeudor,
ProfesionDeudor, ProfesionDeudor2, CUITDeudor, DNIDeudor

#### Contrato Página 2 (Plan de Ahorro — deudores solidarios DS1 a DS4)
ApelDS1/2/3/4, ECivilDS1/2/3/4, ProfesionDS1/2/3/4,
NacDS1/2/3/4, EdadDS1/2/3/4,
Domic1DS1/2/3/4, Domic2DS1/2/3/4, NroDocDS1/2/3/4,
ApoderadoAcr, Obs, OtrasAnot

#### Hoja Continuación 1 (Plan de Ahorro) — descripción del bien
Fecha, Deudor, Deudor2, Marca, Modelo, ModeloAno,
NroMotor, NroChasis, Obs, Bien, SerieNro

#### Hoja Continuación 2 (Plan de Ahorro) — garantes y domicilios
Garante, Garante1Cont, Garante2, Grupo, Orden,
LocalidadRealDeudor, DNIGarante,
DomicilioGarante, Domicilio2Garante, Domicilio3Garante, DomicilioGarante2,
CalleDeudor, NroDeudor, PisoDeudor, DeptoDeudor,
NroGarante, CalleGarante, PisoGarante, DeptoGarante,
NroGaranteAcr, CalleGaranteAcr, PisoGaranteAcr, DeptoGaranteAcr,
Calle1RealDeudor, NroRealDeudor, PciaRealDeudor, Obs, Obs18, Obs1

#### Hoja Continuación 3 (Plan de Ahorro) — asentimiento conyugal
FechaGrupo, Obs, Deudor, Codeudor, Codeudor2, Cont, Orden

#### Contrato Página 1 (Compañía Financiera)
LugaryFecha, AnoP, Pesos, PesosLetras, PesosLetras2, Deudor, Deudor2,
Marca, Tipo, Modelo, MarcaMotor, NroMotor, MarcaChasis, NroChasis,
Unidad, Uso, pcia, dto, Cuartel, NombreEst, Ciudad, Calle,
Docum (leyenda de cuotas/intereses, texto envuelto en varias líneas),
Interesdel, SegPesos, SeguroContra, SeguroCompania, SeguroCalle,
SeguroNro, SeguroPolizaNro, SegVenc, SegVencMes, SegVencAn,
ApyNombreDeudor, ApyNombreDeudor2, ProfesionDEudor, ProfesionDEudor2,
ECivilDeudor, Ed, NacionalidadDeudor, DomicilioDeudor, DomicilioDeudor2,
CUITAcr, DNIDeudor, CUITDeudor

#### Contrato Página 2 (Compañía Financiera — codeudor único + traslado)
ApelCodeudor1, ECivilCodeudor, ProfesionCodeudor, NacCodeudor,
FechaNacCodeudor, NroDocCodeudor, Domic1Codeudor, Domic2Codeudor, Obs,
Traslado, TrasladoMes, TrasladoAno, TrasladoUbic, TrasladoUbicacion2

#### Hojas de Continuación — Compañía Financiera (¡NO reutilizar con Plan de Ahorro!)
**Importante:** las hojas de continuación de Compañía Financiera son
formularios físicos distintos de las de Plan de Ahorro — nombres de campo y
coordenadas no coinciden en nada entre ambas. Se comparó explícitamente
antes de calibrar (ver comentarios en cada archivo de template). Si se
agrega una financiera nueva, no asumir que puede reutilizar las hojas de
continuación de otra — hay que calibrar cada una contra su propio PDF de
referencia.

- **Hoja Continuación 1** (`hojas_continuacion_pagina1`): Lote1/Lote2 (sin
  uso, campos de control interno), Di/Mes/Ano (fecha), Acr (nombre
  acreedor), MontoPrenda, DomAcr (domicilio acreedor), Deudor
- **Hoja Continuación 2** (`hojas_continuacion_pagina2`): Calle1, Calle2,
  DomicLegalDeudor, CiudadlegalDeudor, PciaLegalDeudor
- **Hoja Continuación 3** (`hojas_continuacion_pagina3`) y **Hoja
  Continuación 4** (`hoja_continuacion4`): Lote1/Lote2, Deudor, NroOrden
  (patente), Cont (párrafo, sin calibrar — mismo problema de wrap que "Cont"
  en la Hoja Continuación 3 de Plan de Ahorro). Página 3 y 4 tienen
  **exactamente las mismas coordenadas** — es una hoja "extra" genérica que
  Autoforms repite tantas veces como haga falta (garantes/codeudores
  adicionales), no dos páginas con contenido distinto.

#### ST-04 Página 1 (trámites varios)
Cubre 7 trámites: cambio carrocería, denuncia robo/hurto/recupero,
baja automotor, baja motor, alta motor, cambio domicilio/radicación.
Campos: NroMotorAlta, NroMotorBaja, Patente, MarcaMotorAlta, MarcaMotorBaja,
Modelo, NroChasis, Tipo, Calle, Numero, Piso, Depto, CPostal,
Localidad, Provincia, Partido, Marca, MarcaMotor, NroMotor, MarcaChasis,
FechaPrenda1/2, ImportePrenda1/2, AcreedorPrenda1/2, XTipo1 (tildes)

#### ST-04 Página 2 (titulares y acreedores)
Acreedor1/2, ApoderadoAcr1/2, DNIAcr1/2, LEAcr1/2, LCAcr1/2,
DNIEAcr1/2, CIAcr1/2, PasapAcr1/2, NroDocAcr1/2, AutoridadAcr1/2,
Titular, Condomino, Soltero/Casado/Viudo/Divorc/Nupcia (titular y condómino),
AdqApoTit, AdqApoCond, DNITit/Cond, NroDocTit/Cond, AutoridadTit/Cond,
ConyugeTit/Cond, ApoderadoConyugeTit/Cond,
DNIConyugeTit/Cond, NroDocConyTit/Cond, AutoridadConyTit/Cond,
Obs, AutorizoTDocNro

### Contexto del proyecto
- Proyecto unipersonal — 10hs semanales disponibles
- Socio técnico no disponible
- Claude Code como soporte principal de desarrollo
- MVP realista: 2-3 meses al ritmo actual

### Aclaración importante sobre los campos de Autoforms
Los nombres de campos documentados (ApelDeudor1, CuitDeudor, etc.) son los 
que usa Autoforms internamente y se documentaron como referencia para entender 
qué datos van en cada posición del formulario oficial.

Folio NO debe replicar esos nombres. El sistema propio usará nombres en español 
consistentes con el modelo de datos definido en Supabase.

Los formularios AcroForm que use Folio serán los formularios oficiales de la 
DNRPA escaneados/digitalizados por nosotros — no los de Autoforms.
Los nombres de campos en esos AcroForms los definimos nosotros al crearlos.

## PDFs de precarga de financieras

FCA envía a los gestores un PDF con todos los datos del contrato 
precargados. El sistema debe poder extraer esos datos automáticamente.

### Campos que vienen en el PDF de FCA Plan de Ahorro
- Referencia interna: SOL-XXXXX-XXXXXX
- Monto en números y en letras (ya generado por FCA)
- Datos del deudor: nombre, estado civil, profesión, nacionalidad, 
  edad, domicilio completo
- Datos del vehículo: marca, tipo, modelo, marca motor, N° motor, 
  marca chasis, N° chasis, condición (0km/usado), uso (particular/comercial)
- Datos financieros: cantidad cuotas, importe por cuota, fecha primera 
  cuota, capital, intereses, tasa mora anual
- TEA/CFT: en plan de ahorro siempre 0% (no hay interés directo)

### Campos que NO vienen en el PDF (se obtienen de AFIP)
- DNI del deudor
- CUIT/CUIL
- Fecha de nacimiento

### Archivos de referencia
scripts/referencias/
  fca_plan_ahorro_ejemplo1.pdf  ← LAVACARA JOSE LUIS
  fca_plan_ahorro_ejemplo2.pdf  ← CAGIONI ROBERTO PABLO
  st03_pagina1_datos_reales.pdf ← referencia coordenadas ST-03
  st03_pagina2_datos_reales.pdf ← referencia coordenadas ST-03
  contrato/                     ← pares campos/datos_reales usados para
                                   calibrar el contrato FCA Plan de Ahorro
                                   (contrato_pag1/2, hoja_cont1/2/3)
  contrato_cia_financiera/      ← pares campos/datos_reales usados para
                                   calibrar el contrato FCA Compañía
                                   Financiera (contrato_pagina1/2,
                                   hojas_continuacion_pagina1/2/3,
                                   hoja_continuacion4). Descargados de Drive,
                                   carpeta "contrato" dentro de
                                   PRENDA FIAT/Compañia financiera

### Arquitectura del extractor (Fase 2)
POST /api/extract/pdf-financiera
  → extractorService.ts llama Claude API con el PDF en base64
  → Claude extrae campos estructurados como JSON
  → Sistema sugiere valores en la UI
  → Gestor confirma o corrige antes de guardar
  → Nunca guarda automáticamente sin validación del gestor

### Patrón de nomenclatura para referencias
{financiera}_{tipo_prenda}_ejemplo{N}.pdf
Ejemplos:
  fca_plan_ahorro_ejemplo1.pdf
  fca_compania_financiera_ejemplo1.pdf
  santander_ejemplo1.pdf
  vw_financial_ejemplo1.pdf
  
  ## Roadmap técnico — orden de implementación

### Completado
- Schema completo en Supabase con RLS
- Tipos TypeScript (src/types/index.ts y src/types/pdf.ts)
- Arquitectura de generación PDF (engine + template + service + route)
- ST-03 generando PDF en Legal (612×1008pt) con coordenadas reales
- ST-02 calibrado con coordenadas verificadas de PDFs de referencia
- Contrato FCA Plan de Ahorro calibrado (5 páginas: pag1, pag2, hoja_cont1/2/3)
- Contrato FCA Compañía Financiera calibrado (6 páginas: pag1, pag2,
  hojas_continuacion_pagina1/2/3, hoja_continuacion4) — ver "Hojas de
  Continuación — Compañía Financiera" arriba: usa coordenadas propias, no
  compartidas con Plan de Ahorro

### En curso
- Sin calibración pendiente por ahora — próximo paso es auth/middleware (ver roadmap abajo)

### Próximos pasos en orden

**1. Cerrar calibración PDF**
Verificar que el PDF generado coincida con el de referencia.
Commit cuando esté correcto.

**2. Auth y middleware**
- Login con Supabase Auth
- middleware.ts que proteja todas las rutas excepto /login
- Página /login simple con email + password

**3. UI de carga de prenda — wizard**
- Paso 1: búsqueda por CUIT → consulta AFIP (mock por ahora) → precarga datos persona
- Paso 2: datos del vehículo
- Paso 3: selección de financiera y tipo de prenda (compania_financiera / plan_ahorro)
- Paso 4: datos del contrato (cuotas, montos, tasas)
- Paso 5: revisar y generar PDF

**4. Conectar prendaService a Supabase**
- Reemplazar datos hardcodeados por queries reales
- Guardar trámite, prenda, contrato en Supabase
- RLS activo — cada gestor ve solo sus trámites

**5. Historial de trámites**
- Pantalla principal con listado de trámites del usuario
- Estado, fecha, dominio, financiera
- Botón para reimprimir PDF

**6. Prueba con Mercedes**
Hito clave — validar el flujo completo con una usuaria real
antes de seguir construyendo. Su feedback define las siguientes prioridades.

**7. Extractor de PDF de financiera**
- POST /api/extract/pdf-financiera
- Usa Claude API (claude-sonnet-4-6) para extraer campos del PDF de FCA
- Sugiere valores en la UI del wizard — el gestor siempre confirma
- Archivos de prueba: scripts/referencias/fca_plan_ahorro_ejemplo1.pdf y ejemplo2.pdf

**8. Template de acreedor**
- Cargar datos fijos de financieras en tabla template_acreedor
- Texto parametrizado de la leyenda para compañía financiera
- Plan de ahorro: sin leyenda (viene preimpresa en el papel)

**9. Integración AFIP/ARCA real**
- Reemplazar mock del paso 1 por API real
- Lookup por CUIT → nombre, domicilio, actividad, estado civil

**10. ST-02 y Formulario 03**
- Mismo patrón que ST-03: template + coordenadas reales
- Se generan automáticamente junto con la prenda

### Después de Mercedes (definir según feedback)
- Gestión de impresoras con offset X/Y por usuario
- Editor visual de ajuste fino de coordenadas
- Extractor OCR foto DNI (Fase 3)
- Extractor foto título del vehículo (Fase 3)
- Agente IA para incorporar formularios de financieras nuevas (Fase 4)
- App nativa iOS/Android (Fase 4)