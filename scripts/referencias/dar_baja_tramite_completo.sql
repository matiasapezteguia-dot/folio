-- RPC dar_baja_tramite_completo: soft delete en cascada de un trámite y sus
-- tablas hijas exclusivas, en una sola transacción — mismo patrón que
-- guardar_tramite_completo.sql (blindaje de search_path, sin bloque
-- EXCEPTION para que cualquier error aborte todo sin dejar nada a medias).
--
-- Alcance de las FKs, confirmado con el MCP antes de escribir esto (mismos
-- nombres que ya se habían usado en guardar_tramite_completo.sql):
--   tramite.id_especificacion_vehiculo -> especificacion_vehiculo.id
--   tramite.id_prenda                 -> prenda.id            (fk_tramite_prenda)
--   prenda.id_contrato                -> contrato.id
--   prenda.id_tasas_penalidades       -> tasas_penalidades_seguros.id
--   tramite_titular.id_tramite        -> tramite.id
--
-- Deliberadamente NO se toca persona ni domicilio: son compartidas entre
-- trámites/gestores (persona incluso tiene SELECT abierto a todos), dar de
-- baja un trámite puntual no debe afectarlas. Tampoco se toca
-- prenda_deudor/formulario/formulario_03/formulario_prenda — fuera de
-- alcance de esta tarea (ninguno lo crea guardar_tramite_completo hoy).
--
-- CUIDADO al leer esto: el parámetro se llama id_tramite (necesario para el
-- contrato del RPC — el cliente llama
-- supabase.rpc('dar_baja_tramite_completo', { id_tramite: ... })), pero
-- tramite_titular TAMBIÉN tiene una columna llamada id_tramite.
--
-- Copiar el parámetro a v_id_tramite (abajo) NO alcanza por sí solo: el
-- parámetro original sigue vivo en el scope de toda la función (no
-- desaparece por tener una copia), así que "id_tramite" sin calificar sigue
-- siendo ambiguo en cualquier statement sobre tramite_titular — confirmado
-- en la prueba real: "42702: column reference \"id_tramite\" is ambiguous"
-- apenas se probó. La función abortó entera sin escribir nada (transacción
-- atómica funcionando bien), pero había que corregirlo antes de seguir.
--
-- El fix real es calificar la columna con el nombre de tabla en el UPDATE de
-- tramite_titular (WHERE tramite_titular.id_tramite = v_id_tramite) — una
-- referencia calificada nunca es ambigua con una variable/parámetro de
-- PL/pgSQL, sin importar que el parámetro siga en scope.
--
-- Ejecutar manualmente en Supabase → SQL Editor, DESPUÉS de
-- guardar_tramite_completo.sql (ya aplicado).

CREATE OR REPLACE FUNCTION dar_baja_tramite_completo(id_tramite uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_usuario uuid := auth.uid();
  v_id_tramite uuid := id_tramite;
  v_id_especificacion_vehiculo uuid;
  v_id_prenda uuid;
  v_id_contrato uuid;
  v_id_tasas_penalidades uuid;
BEGIN
  IF v_usuario IS NULL THEN
    RAISE EXCEPTION 'dar_baja_tramite_completo requiere un usuario autenticado';
  END IF;

  -- Verificación explícita de pertenencia: no asumimos que RLS ya nos
  -- protege silenciosamente (si el UPDATE de tramite más abajo afectara 0
  -- filas por RLS, sería indistinguible de "ya se dio de baja" o de un id
  -- inexistente) — con esto damos un mensaje claro en los tres casos.
  SELECT t.id_especificacion_vehiculo, t.id_prenda
    INTO v_id_especificacion_vehiculo, v_id_prenda
  FROM tramite t
  WHERE t.id = v_id_tramite
    AND t.id_usuario = v_usuario
    AND t.fecha_baja IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El trámite % no existe, no pertenece a este usuario, o ya está dado de baja', v_id_tramite;
  END IF;

  IF v_id_prenda IS NOT NULL THEN
    SELECT pr.id_contrato, pr.id_tasas_penalidades
      INTO v_id_contrato, v_id_tasas_penalidades
    FROM prenda pr
    WHERE pr.id = v_id_prenda;
  END IF;

  UPDATE tramite SET fecha_baja = now() WHERE id = v_id_tramite;

  UPDATE tramite_titular
  SET fecha_baja = now()
  WHERE tramite_titular.id_tramite = v_id_tramite AND tramite_titular.fecha_baja IS NULL;

  IF v_id_especificacion_vehiculo IS NOT NULL THEN
    UPDATE especificacion_vehiculo SET fecha_baja = now() WHERE id = v_id_especificacion_vehiculo;
  END IF;

  IF v_id_prenda IS NOT NULL THEN
    UPDATE prenda SET fecha_baja = now() WHERE id = v_id_prenda;

    IF v_id_contrato IS NOT NULL THEN
      UPDATE contrato SET fecha_baja = now() WHERE id = v_id_contrato;
    END IF;

    IF v_id_tasas_penalidades IS NOT NULL THEN
      UPDATE tasas_penalidades_seguros SET fecha_baja = now() WHERE id = v_id_tasas_penalidades;
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION dar_baja_tramite_completo(uuid) TO authenticated;
