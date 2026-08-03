-- RPC actualizar_tramite_completo: contraparte UPDATE de
-- guardar_tramite_completo.sql, para reabrir un trámite existente en el
-- wizard y editarlo. Misma transacción implícita (sin bloque EXCEPTION),
-- mismo SECURITY INVOKER + SET search_path = public, extensions, reusa
-- resolver_domicilio/resolver_persona_humana/resolver_persona_juridica
-- (scripts/referencias/resolvers_persona_domicilio.sql — ejecutar ANTES que
-- este archivo).
--
-- CUIDADO — mismo bug ya encontrado y corregido en dar_baja_tramite_completo:
-- el parámetro se llama id_tramite (necesario para el contrato del RPC:
-- supabase.rpc('actualizar_tramite_completo', { id_tramite: ..., payload: ... })),
-- pero tanto tramite_titular como prenda TIENEN una columna llamada
-- id_tramite. Copiar el parámetro a v_id_tramite no alcanza por sí solo (el
-- parámetro original sigue en scope toda la función) — cualquier referencia
-- sin calificar a "id_tramite" dentro de un statement sobre esas dos tablas
-- sería ambigua. Por eso: nunca se escribe id_tramite a secas en ningún
-- WHERE/SET de esta función — siempre v_id_tramite (la variable) o
-- tabla.id_tramite (la columna, calificada).
--
-- Alcance: mismas 7 tablas que guardar_tramite_completo, pero como UPDATE en
-- vez de INSERT — salvo tramite_titular, que se soft-deletea entero y se
-- recrea desde cero (más simple y seguro que diffear titular por titular,
-- confirmado con el volumen bajo de titulares por trámite). NO se toca
-- persona ni domicilio directamente acá (eso lo resuelven los 3 resolvers
-- compartidos con el alta) más que a través de esos resolvers.
--
-- A diferencia del alta, acá las llamadas a resolver_persona_humana y
-- resolver_persona_juridica pasan p_forzar_actualizacion_domicilio := true:
-- si el gestor corrige la dirección de un titular/acreedor ya vinculado a
-- una persona existente, ese campo (id_domicilio_real/id_domicilio_legal)
-- ya no está en null desde el primer guardado, así que sin este flag el
-- resolver nunca lo actualizaría (ver resolvers_persona_domicilio.sql para
-- el detalle). Sigue sujeto a RLS igual que siempre: si la persona
-- pertenece a otro gestor, el UPDATE no afecta filas, el flag no bypasea nada.
--
-- Decisiones de negocio confirmadas antes de escribir esto:
--   - contrato.fecha NO se pisa con current_date al editar: representa
--     cuándo se pactó el contrato, no cuándo se editó el registro (para eso
--     está fecha_modificacion). Se deja intacta.
--   - Si tramite.estado estaba en 'generado' o 'impreso', pasa a 'borrador'
--     al editar (invalida los documentos ya generados con los datos viejos).
--     Si estaba en 'borrador' o 'anulado', se mantiene igual.
--   - fecha_modificacion = now() en especificacion_vehiculo, prenda,
--     contrato, tasas_penalidades_seguros y tramite (confirmado con MCP que
--     la columna existe en las 8 tablas del alcance antes de asumirlo). No
--     se toca en tramite_titular (las filas viejas solo reciben fecha_baja,
--     mismo criterio que dar_baja_tramite_completo; las nuevas son inserts
--     frescos) ni en persona/domicilio (comportamiento de los resolvers,
--     sin cambios respecto del alta).
--
-- Ejecutar manualmente en Supabase → SQL Editor, DESPUÉS de
-- resolvers_persona_domicilio.sql y guardar_tramite_completo.sql (ya
-- aplicadas/a aplicar antes que esta).

CREATE OR REPLACE FUNCTION actualizar_tramite_completo(id_tramite uuid, payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_usuario uuid := auth.uid();
  v_id_tramite uuid := id_tramite;

  v_vehiculo jsonb := payload->'vehiculo';
  v_financiera jsonb := payload->'financiera';
  v_acreedor jsonb := v_financiera->'acreedor';
  v_contrato jsonb := payload->'contrato';
  v_titular jsonb;
  v_orden smallint := 0;

  v_estado_actual varchar;
  v_id_especificacion_vehiculo uuid;
  v_id_prenda uuid;
  v_id_contrato uuid;
  v_id_tasas_penalidades uuid;

  v_id_marca uuid;
  v_id_modelo uuid;
  v_id_tipo uuid;
  v_id_marca_chasis uuid;
  v_id_marca_motor uuid;

  v_id_domicilio uuid;
  v_id_persona uuid;
  v_id_persona_acreedor uuid;

  v_fecha_primera_cuota date;
  v_cantidad_cuotas smallint;
BEGIN
  IF v_usuario IS NULL THEN
    RAISE EXCEPTION 'actualizar_tramite_completo requiere un usuario autenticado';
  END IF;

  -- 1) Verificación explícita de pertenencia (mismo criterio que
  -- dar_baja_tramite_completo: no asumimos que RLS ya nos protege
  -- silenciosamente) + ids de las tablas hijas exclusivas -----------------
  SELECT t.id_especificacion_vehiculo, t.id_prenda, t.estado
    INTO v_id_especificacion_vehiculo, v_id_prenda, v_estado_actual
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

  -- 2) especificacion_vehiculo: mismo bloque de lookups que
  -- guardar_tramite_completo.sql, sin reinventarlo ------------------------
  SELECT id INTO v_id_marca FROM marca_vehiculo
    WHERE unaccent(nombre) ILIKE unaccent(trim(v_vehiculo->>'marca'))
      AND fecha_baja IS NULL
    LIMIT 1;

  IF v_id_marca IS NOT NULL THEN
    SELECT id INTO v_id_modelo FROM modelo_vehiculo
      WHERE id_marca = v_id_marca
        AND unaccent(nombre) ILIKE unaccent(trim(v_vehiculo->>'modelo'))
        AND fecha_baja IS NULL
      LIMIT 1;
  END IF;

  IF v_id_modelo IS NOT NULL AND coalesce(v_vehiculo->>'tipo', '') <> '' THEN
    SELECT id INTO v_id_tipo FROM modelo_vehiculo_tipo
      WHERE id_modelo = v_id_modelo
        AND unaccent(descripcion_tipo) ILIKE unaccent(trim(v_vehiculo->>'tipo'))
        AND fecha_baja IS NULL
      LIMIT 1;
  END IF;

  SELECT id INTO v_id_marca_chasis FROM marca_vehiculo
    WHERE unaccent(nombre) ILIKE unaccent(trim(v_vehiculo->>'marcaChasis'))
      AND fecha_baja IS NULL
    LIMIT 1;

  SELECT id INTO v_id_marca_motor FROM marca_vehiculo
    WHERE unaccent(nombre) ILIKE unaccent(trim(v_vehiculo->>'marcaMotor'))
      AND fecha_baja IS NULL
    LIMIT 1;

  IF v_id_especificacion_vehiculo IS NOT NULL THEN
    UPDATE especificacion_vehiculo SET
      id_marca = v_id_marca,
      id_modelo = v_id_modelo,
      id_tipo = v_id_tipo,
      id_marca_chasis = v_id_marca_chasis,
      numero_chasis = NULLIF(v_vehiculo->>'numeroChasis', ''),
      id_marca_motor = v_id_marca_motor,
      numero_motor = NULLIF(v_vehiculo->>'numeroMotor', ''),
      uso = NULLIF(v_vehiculo->>'uso', ''),
      patente = NULLIF(v_vehiculo->>'patente', ''),
      color = NULLIF(v_vehiculo->>'color', ''),
      fecha_modificacion = now()
    WHERE id = v_id_especificacion_vehiculo;
  END IF;

  -- 3) titulares: soft-delete de los actuales + recrear desde cero con
  -- resolver_domicilio + resolver_persona_humana --------------------------
  UPDATE tramite_titular
  SET fecha_baja = now()
  WHERE tramite_titular.id_tramite = v_id_tramite AND tramite_titular.fecha_baja IS NULL;

  FOR v_titular IN SELECT * FROM jsonb_array_elements(payload->'titulares')
  LOOP
    v_orden := v_orden + 1;

    v_id_domicilio := resolver_domicilio(
      v_titular->>'calle', v_titular->>'numero', v_titular->>'localidad', v_titular->>'provincia', v_usuario
    );

    v_id_persona := resolver_persona_humana(
      v_titular->>'cuitDni', v_titular->>'apellido', v_titular->>'nombre', v_titular->>'nacionalidad',
      v_titular->>'fechaNacimiento', v_titular->>'profesion', v_titular->>'estadoCivil',
      v_titular->>'telefono', v_titular->>'email', v_id_domicilio, v_usuario,
      format('titular en orden %s', v_orden),
      p_forzar_actualizacion_domicilio := true
    );

    INSERT INTO tramite_titular (id_tramite, id_titular, porcentaje, orden, id_usuario)
    VALUES (v_id_tramite, v_id_persona, (v_titular->>'porcentaje')::numeric, v_orden, v_usuario);
  END LOOP;

  -- 4) acreedor: resolver_domicilio + resolver_persona_juridica, y
  -- re-vincular en prenda ---------------------------------------------------
  IF v_acreedor IS NULL OR coalesce(v_acreedor->>'cuit', '') = '' THEN
    RAISE EXCEPTION 'financiera.acreedor.cuit es obligatorio para guardar el trámite';
  END IF;

  v_id_domicilio := resolver_domicilio(
    v_acreedor->>'calle', v_acreedor->>'numero', v_acreedor->>'localidad', v_acreedor->>'provincia', v_usuario
  );

  v_id_persona_acreedor := resolver_persona_juridica(
    v_acreedor->>'cuit', v_acreedor->>'nombre', v_id_domicilio, v_usuario,
    p_forzar_actualizacion_domicilio := true
  );

  IF v_id_prenda IS NOT NULL THEN
    UPDATE prenda SET
      id_acreedor_prendario = v_id_persona_acreedor,
      fecha_modificacion = now()
    WHERE id = v_id_prenda;
  END IF;

  -- 5) contrato: fecha NO se toca (fecha del contrato, no de edición) ------
  v_cantidad_cuotas := NULLIF(v_contrato->>'cantidadCuotas', '')::smallint;
  v_fecha_primera_cuota := NULLIF(v_contrato->>'fechaPrimeraCuota', '')::date;

  IF v_id_contrato IS NOT NULL THEN
    UPDATE contrato SET
      lugar = NULLIF(v_contrato->>'lugarCelebracion', ''),
      monto = NULLIF(v_contrato->>'monto', '')::numeric,
      clase = NULLIF(v_contrato->>'clase', ''),
      moneda = NULLIF(v_contrato->>'moneda', ''),
      cantidad_cuotas = v_cantidad_cuotas,
      importe_cuota = NULLIF(v_contrato->>'importeCuota', '')::numeric,
      vencimiento_primer_cuota = v_fecha_primera_cuota,
      vencimiento_ultima_cuota = CASE
        WHEN v_fecha_primera_cuota IS NOT NULL AND v_cantidad_cuotas IS NOT NULL
        THEN (v_fecha_primera_cuota + ((v_cantidad_cuotas - 1) || ' months')::interval)::date
        ELSE NULL
      END,
      fecha_modificacion = now()
    WHERE id = v_id_contrato;
  END IF;

  -- 6) tasas_penalidades_seguros — pun/pen siguen sin tocarse, mismo
  -- criterio del alta -------------------------------------------------------
  IF v_id_tasas_penalidades IS NOT NULL THEN
    UPDATE tasas_penalidades_seguros SET
      tea = NULLIF(v_contrato->>'tea', '')::numeric,
      fecha_modificacion = now()
    WHERE id = v_id_tasas_penalidades;
  END IF;

  -- 7) tramite: editar invalida documentos ya generados --------------------
  UPDATE tramite SET
    estado = CASE WHEN v_estado_actual IN ('generado', 'impreso') THEN 'borrador' ELSE v_estado_actual END,
    fecha_modificacion = now()
  WHERE id = v_id_tramite;
END;
$$;

GRANT EXECUTE ON FUNCTION actualizar_tramite_completo(uuid, jsonb) TO authenticated;
