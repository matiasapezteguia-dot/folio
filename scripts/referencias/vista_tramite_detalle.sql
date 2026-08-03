-- Vista vista_tramite_detalle: detalle completo de UN trámite, para
-- reabrirlo en el wizard de edición (subpaso 5). A diferencia de
-- vista_tramites_resumen.sql (una fila resumen por trámite, para el
-- listado), esta trae TODOS los titulares activos como array jsonb.
--
-- Mismo criterio de seguridad que vista_tramites_resumen.sql, no lo omito:
-- CREATE VIEW sin security_invoker=true evalúa RLS con el rol dueño de la
-- vista (postgres en este proyecto, que tiene rolbypassrls=true) en vez del
-- rol que consulta — sin el flag, cualquier gestor vería el detalle de
-- trámites de otros. Con security_invoker=true, la vista aplica RLS con el
-- rol que la consulta, heredando correctamente
-- tramite/especificacion_vehiculo/tramite_titular/prenda/contrato/
-- tasas_penalidades_seguros (todas con policy id_usuario = auth.uid()) y
-- persona/domicilio/marca_vehiculo/modelo_vehiculo (SELECT abierto a todos,
-- igual que en el resumen).
--
-- titulares: subquery correlacionada con jsonb_agg (no un join plano) porque
-- necesito un array por trámite, no una fila por titular — ordenado por
-- tramite_titular.orden, filtrando fecha_baja IS NULL (solo los activos:
-- actualizar_tramite_completo soft-deletea los viejos y recrea desde cero).
--
-- Ejecutar manualmente en Supabase → SQL Editor.

CREATE OR REPLACE VIEW vista_tramite_detalle
WITH (security_invoker = true)
AS
SELECT
  tr.id,
  tr.estado,

  mv.nombre AS marca,
  mo.nombre AS modelo,
  mt.descripcion_tipo AS tipo,
  mvc.nombre AS marca_chasis,
  mvm.nombre AS marca_motor,
  ev.numero_chasis,
  ev.numero_motor,
  ev.uso,
  ev.patente,
  ev.color,

  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'cuit', p.cuit,
        'dni', p.dni,
        'tipo_documento', p.tipo_documento,
        'apellido', p.apellido,
        'nombre', p.nombre,
        'nacionalidad', p.nacionalidad,
        'fecha_nacimiento', p.fecha_nacimiento,
        'profesion', p.profesion,
        'estado_civil', p.estado_civil,
        'telefono', p.telefono,
        'mail', p.mail,
        'porcentaje', tt.porcentaje,
        'orden', tt.orden,
        'calle', d.calle,
        'numero', d.numero,
        'localidad', d.localidad,
        'provincia', d.provincia
      ) ORDER BY tt.orden
    )
    FROM tramite_titular tt
    JOIN persona p ON p.id = tt.id_titular
    LEFT JOIN domicilio d ON d.id = p.id_domicilio_real
    WHERE tt.id_tramite = tr.id AND tt.fecha_baja IS NULL
  ) AS titulares,

  p_acreedor.cuit AS acreedor_cuit,
  p_acreedor.denominacion AS acreedor_denominacion,
  d_acreedor.calle AS acreedor_calle,
  d_acreedor.numero AS acreedor_numero,
  d_acreedor.localidad AS acreedor_localidad,
  d_acreedor.provincia AS acreedor_provincia,

  c.lugar AS contrato_lugar,
  c.monto AS contrato_monto,
  c.clase AS contrato_clase,
  c.moneda AS contrato_moneda,
  c.cantidad_cuotas AS contrato_cantidad_cuotas,
  c.importe_cuota AS contrato_importe_cuota,
  c.vencimiento_primer_cuota AS contrato_vencimiento_primer_cuota,

  tps.tea AS tasas_tea

FROM tramite tr
LEFT JOIN especificacion_vehiculo ev ON ev.id = tr.id_especificacion_vehiculo
LEFT JOIN marca_vehiculo mv ON mv.id = ev.id_marca
LEFT JOIN modelo_vehiculo mo ON mo.id = ev.id_modelo
LEFT JOIN modelo_vehiculo_tipo mt ON mt.id = ev.id_tipo
LEFT JOIN marca_vehiculo mvc ON mvc.id = ev.id_marca_chasis
LEFT JOIN marca_vehiculo mvm ON mvm.id = ev.id_marca_motor
LEFT JOIN prenda pr ON pr.id = tr.id_prenda
LEFT JOIN persona p_acreedor ON p_acreedor.id = pr.id_acreedor_prendario
LEFT JOIN domicilio d_acreedor ON d_acreedor.id = p_acreedor.id_domicilio_legal
LEFT JOIN contrato c ON c.id = pr.id_contrato
LEFT JOIN tasas_penalidades_seguros tps ON tps.id = pr.id_tasas_penalidades
WHERE tr.fecha_baja IS NULL;
