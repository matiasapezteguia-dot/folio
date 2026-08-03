-- Vista vista_tramites_resumen: un resumen por trámite para el listado en
-- /tramites (y reutilizable después para el "reimprimir PDF" del subpaso 6).
-- Centraliza el join que hoy vive repartido en tramite,
-- especificacion_vehiculo (+ marca_vehiculo/modelo_vehiculo), tramite_titular
-- (+ persona del titular principal) y prenda (+ persona del acreedor).
--
-- IMPORTANTE — seguridad, no es un supuesto: la pregunta era si una vista
-- simple "hereda" el RLS de las tablas base sin hacer nada especial. La
-- respuesta es NO por default. Confirmé con el MCP:
--   - Postgres de este proyecto es 17.6 (soporta la opción de vista
--     security_invoker, agregada en PG15).
--   - El rol que crea esta vista desde el SQL Editor es "postgres", que
--     tiene rolbypassrls = true (bypassa RLS).
--   - CREATE VIEW sin security_invoker explícito crea la vista con
--     security_invoker = false (default de Postgres, por compatibilidad
--     hacia atrás) — con eso, una vista corre los chequeos de RLS con el
--     ROL DUEÑO de la vista, no con el rol que la consulta. Como el dueño
--     acá sería "postgres" (bypassa RLS), CUALQUIER usuario autenticado que
--     consultara esta vista vería los trámites de TODOS los gestores, no
--     solo los propios — un agujero de RLS real, no teórico.
--
-- La corrección es WITH (security_invoker = true): fuerza a que la vista
-- evalúe permisos y políticas RLS con el rol que la está consultando (el
-- gestor autenticado), exactamente el mismo comportamiento que consultar
-- las tablas base directamente. Con esto, la vista SÍ hereda el RLS de
-- tramite/especificacion_vehiculo/tramite_titular/prenda tal cual (todas
-- con policy "id_usuario = auth.uid()"). persona sigue con su policy propia
-- de SELECT abierto a todos ("todos pueden ver personas") — no cambia nada
-- ahí, es el mismo comportamiento que ya tiene esa tabla hoy.
--
-- No es materializada (no hace falta cachear: son 8 tablas con volumen bajo
-- todavía) y no tiene security_barrier (no hay funciones costosas ni con
-- side effects en el WHERE que ameriten esa protección adicional).
--
-- tramite.fecha_baja IS NULL para no mostrar trámites dados de baja cuando
-- el subpaso 4 (baja) exista — hoy no hay ninguno, pero la vista ya queda
-- correcta sin tener que tocarla de nuevo en ese momento.
--
-- Ejecutar manualmente en Supabase → SQL Editor.

CREATE OR REPLACE VIEW vista_tramites_resumen
WITH (security_invoker = true)
AS
SELECT
  tr.id,
  tr.estado,
  tr.fecha_creacion,
  ev.patente,
  mv.nombre AS marca,
  mo.nombre AS modelo,
  concat_ws(', ', p_titular.apellido, p_titular.nombre) AS titular_principal,
  p_acreedor.denominacion AS acreedor
FROM tramite tr
LEFT JOIN especificacion_vehiculo ev ON ev.id = tr.id_especificacion_vehiculo
LEFT JOIN marca_vehiculo mv ON mv.id = ev.id_marca
LEFT JOIN modelo_vehiculo mo ON mo.id = ev.id_modelo
LEFT JOIN tramite_titular tt ON tt.id_tramite = tr.id AND tt.orden = 1
LEFT JOIN persona p_titular ON p_titular.id = tt.id_titular
LEFT JOIN prenda pr ON pr.id = tr.id_prenda
LEFT JOIN persona p_acreedor ON p_acreedor.id = pr.id_acreedor_prendario
WHERE tr.fecha_baja IS NULL;
