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

#### Contrato Página 1
LugaryFecha, NacionalidadDeudor, AnoP, Ciudad, Calle, Tipo, Uso,
pcia, dto, Cuartel, NombreEst, ECivilDeudor,
ProfesionDeudor, ProfesionDeudor2, CUITDeudor, DNIDeudor

#### Contrato Página 2 (deudores solidarios DS1 a DS4)
ApelDS1/2/3/4, ECivilDS1/2/3/4, ProfesionDS1/2/3/4,
NacDS1/2/3/4, EdadDS1/2/3/4,
Domic1DS1/2/3/4, Domic2DS1/2/3/4, NroDocDS1/2/3/4,
ApoderadoAcr, Obs, OtrasAnot

#### Hoja Continuación 1 — descripción del bien
Fecha, Deudor, Deudor2, Marca, Modelo, ModeloAno,
NroMotor, NroChasis, Obs, Bien, SerieNro

#### Hoja Continuación 2 — garantes y domicilios
Garante, Garante1Cont, Garante2, Grupo, Orden,
LocalidadRealDeudor, DNIGarante,
DomicilioGarante, Domicilio2Garante, Domicilio3Garante, DomicilioGarante2,
CalleDeudor, NroDeudor, PisoDeudor, DeptoDeudor,
NroGarante, CalleGarante, PisoGarante, DeptoGarante,
NroGaranteAcr, CalleGaranteAcr, PisoGaranteAcr, DeptoGaranteAcr,
Calle1RealDeudor, NroRealDeudor, PciaRealDeudor, Obs, Obs18, Obs1

#### Hoja Continuación 3 — asentimiento conyugal
FechaGrupo, Obs, Deudor, Codeudor, Codeudor2, Cont, Orden

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