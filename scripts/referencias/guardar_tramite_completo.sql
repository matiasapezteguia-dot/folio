-- RPC guardar_tramite_completo: persiste un trámite completo armado por el
-- wizard de carga de prenda (src/app/(dashboard)/prendas/nueva/), en una
-- sola transacción — si cualquier paso falla, la excepción aborta la
-- transacción completa y no queda nada escrito (comportamiento por defecto
-- de una función plpgsql sin bloque EXCEPTION: no hay commits parciales).
--
-- Alcance: tramite, especificacion_vehiculo, persona (titulares + acreedor),
-- domicilio (titulares + acreedor), tramite_titular, contrato,
-- tasas_penalidades_seguros, prenda. Deliberadamente fuera de alcance:
-- prenda_deudor (deudores solidarios/garante — decisión de la sesión de
-- mapeo, no implementado todavía) y formulario/formulario_03/formulario_prenda
-- (se generan en un paso posterior, no en el guardado del trámite).
--
-- El find-or-create de domicilio/persona (titulares y acreedor) vive en
-- resolver_domicilio/resolver_persona_humana/resolver_persona_juridica
-- (scripts/referencias/resolvers_persona_domicilio.sql, ejecutar ANTES que
-- este archivo) — extraído para reusarlo también en
-- actualizar_tramite_completo.sql, sin duplicar la lógica. El comportamiento
-- de esta función no cambió por la extracción: mismos mensajes de error,
-- mismos criterios de match, mismo resultado. Las llamadas de acá abajo NO
-- pasan p_forzar_actualizacion_domicilio (usan el default false) — ese flag
-- es solo para actualizar_tramite_completo.sql, donde sí hace falta
-- re-vincular el domicilio de una persona ya existente al editar.
--
-- Mapeo acordado en la sesión de introspección (2026-08-02) contra el schema
-- real de Supabase (proyecto cihdrbegtnplxpiffbwh):
--   - id_marca/id_modelo/id_tipo: resueltos por nombre exacto (case+acento
--     insensitive) contra marca_vehiculo/modelo_vehiculo/modelo_vehiculo_tipo.
--   - id_marca_chasis/id_marca_motor: mismo criterio sobre marca_vehiculo,
--     pero vehiculo.marcaChasis/marcaMotor son texto libre en el wizard (no
--     comboboxes) — si no hay match exacto, se guardan en null. Nunca se
--     crea una fila nueva en marca_vehiculo (catálogo oficial DNRPA, no se
--     contamina con texto libre del usuario).
--   - persona.id_domicilio_real para titulares (persona física), vs.
--     persona.id_domicilio_legal para el acreedor (persona jurídica) — la
--     distinción es por persona.tipo, no arbitraria.
--   - Titular y acreedor usan el mismo criterio de find-or-create: domicilio
--     por calle+numero+localidad+provincia (case+acento insensitive vía
--     unaccent, salvo numero), persona por CUIT/DNI ya separado (mismo
--     algoritmo que separarCuitDni() en prendaService.ts). CUIT/DNI vacío o
--     CUIT que no tiene 11 dígitos son errores explícitos (RAISE EXCEPTION),
--     nunca se guarda una persona sin identificador ni un CUIT malformado.
--   - contrato.lugar ← contrato.lugarCelebracion (nunca lugarPago).
--   - tasas_penalidades_seguros.pun/pen quedan en null (pendiente de
--     confirmación de dominio, no hay mapeo confiable desde tasaMoraAnual).
--   - contrato.vencimiento_ultima_cuota calculado: fechaPrimeraCuota +
--     (cantidadCuotas - 1) meses.
--   - Todas las tablas con RLS por id_usuario = auth.uid() (tramite,
--     especificacion_vehiculo, persona, domicilio, tramite_titular,
--     contrato, tasas_penalidades_seguros, prenda) reciben auth.uid()
--     explícito — con with_check implícito en esas policies, un insert sin
--     id_usuario correcto es rechazado por RLS, columna nullable o no.
--
-- Requiere la extensión unaccent (para el match "sin acentos" de marcas,
-- punto 1 del mapeo) — CREATE EXTENSION IF NOT EXISTS la deja instalada sin
-- error si ya está. Instalada en el schema "extensions" (WITH SCHEMA), no en
-- "public": es donde ya viven uuid-ossp/pgcrypto/pg_stat_statements en este
-- proyecto — instalarla sin esa cláusula caería en "public" por default de
-- search_path, rompiendo esa convención (y es justo lo que el linter de
-- seguridad de Supabase marca como "extension in public schema").
--
-- La función fija SET search_path = public, extensions explícito: no es
-- estrictamente necesario para que resuelva unaccent() (public y extensions
-- ya están en el search_path por default), pero es la práctica recomendada
-- por Supabase para toda función SECURITY DEFINER/INVOKER — cierra el riesgo
-- de search_path injection si en el futuro cambia a SECURITY DEFINER.
--
-- Ejecutar manualmente en Supabase → SQL Editor, DESPUÉS de
-- especificacion_vehiculo_patente_color.sql y resolvers_persona_domicilio.sql
-- (ambas ya aplicadas/a aplicar antes que esta).

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION guardar_tramite_completo(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_usuario uuid := auth.uid();

  v_vehiculo jsonb := payload->'vehiculo';
  v_financiera jsonb := payload->'financiera';
  v_acreedor jsonb := v_financiera->'acreedor';
  v_contrato jsonb := payload->'contrato';
  v_titular jsonb;
  v_orden smallint := 0;

  v_id_marca uuid;
  v_id_modelo uuid;
  v_id_tipo uuid;
  v_id_marca_chasis uuid;
  v_id_marca_motor uuid;
  v_id_especificacion uuid;
  v_id_tramite uuid;

  v_id_domicilio uuid;
  v_id_persona uuid;
  v_id_persona_acreedor uuid;

  v_id_contrato uuid;
  v_id_tasas uuid;
  v_id_prenda uuid;

  v_fecha_primera_cuota date;
  v_cantidad_cuotas smallint;
BEGIN
  IF v_usuario IS NULL THEN
    RAISE EXCEPTION 'guardar_tramite_completo requiere un usuario autenticado';
  END IF;

  -- 1) especificacion_vehiculo -----------------------------------------
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

  -- id_marca_chasis / id_marca_motor: texto libre en el wizard, match
  -- exacto (case+acento insensitive) contra marca_vehiculo; sin match → null,
  -- nunca se crea una marca nueva (catálogo oficial DNRPA).
  SELECT id INTO v_id_marca_chasis FROM marca_vehiculo
    WHERE unaccent(nombre) ILIKE unaccent(trim(v_vehiculo->>'marcaChasis'))
      AND fecha_baja IS NULL
    LIMIT 1;

  SELECT id INTO v_id_marca_motor FROM marca_vehiculo
    WHERE unaccent(nombre) ILIKE unaccent(trim(v_vehiculo->>'marcaMotor'))
      AND fecha_baja IS NULL
    LIMIT 1;

  INSERT INTO especificacion_vehiculo (
    id_marca, id_modelo, id_tipo, id_marca_chasis, numero_chasis,
    id_marca_motor, numero_motor, uso, patente, color, id_usuario
  ) VALUES (
    v_id_marca, v_id_modelo, v_id_tipo,
    v_id_marca_chasis, NULLIF(v_vehiculo->>'numeroChasis', ''),
    v_id_marca_motor, NULLIF(v_vehiculo->>'numeroMotor', ''),
    NULLIF(v_vehiculo->>'uso', ''),
    NULLIF(v_vehiculo->>'patente', ''), NULLIF(v_vehiculo->>'color', ''),
    v_usuario
  )
  RETURNING id INTO v_id_especificacion;

  -- 2) tramite (id_prenda todavía null) ----------------------------------
  INSERT INTO tramite (id_especificacion_vehiculo, estado, id_usuario)
  VALUES (v_id_especificacion, 'borrador', v_usuario)
  RETURNING id INTO v_id_tramite;

  -- 3) titulares: resolver_domicilio + resolver_persona_humana + tramite_titular
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
      format('titular en orden %s', v_orden)
    );

    INSERT INTO tramite_titular (id_tramite, id_titular, porcentaje, orden, id_usuario)
    VALUES (v_id_tramite, v_id_persona, (v_titular->>'porcentaje')::numeric, v_orden, v_usuario);
  END LOOP;

  -- 4) acreedor: resolver_domicilio + resolver_persona_juridica -----------
  IF v_acreedor IS NULL OR coalesce(v_acreedor->>'cuit', '') = '' THEN
    RAISE EXCEPTION 'financiera.acreedor.cuit es obligatorio para guardar el trámite';
  END IF;

  v_id_domicilio := resolver_domicilio(
    v_acreedor->>'calle', v_acreedor->>'numero', v_acreedor->>'localidad', v_acreedor->>'provincia', v_usuario
  );

  v_id_persona_acreedor := resolver_persona_juridica(
    v_acreedor->>'cuit', v_acreedor->>'nombre', v_id_domicilio, v_usuario
  );

  -- 5) contrato -------------------------------------------------------------
  v_cantidad_cuotas := NULLIF(v_contrato->>'cantidadCuotas', '')::smallint;
  v_fecha_primera_cuota := NULLIF(v_contrato->>'fechaPrimeraCuota', '')::date;

  INSERT INTO contrato (
    lugar, fecha, monto, clase, moneda, cantidad_cuotas, importe_cuota,
    vencimiento_primer_cuota, vencimiento_ultima_cuota, id_usuario
  ) VALUES (
    NULLIF(v_contrato->>'lugarCelebracion', ''),
    current_date,
    NULLIF(v_contrato->>'monto', '')::numeric,
    NULLIF(v_contrato->>'clase', ''),
    NULLIF(v_contrato->>'moneda', ''),
    v_cantidad_cuotas,
    NULLIF(v_contrato->>'importeCuota', '')::numeric,
    v_fecha_primera_cuota,
    CASE
      WHEN v_fecha_primera_cuota IS NOT NULL AND v_cantidad_cuotas IS NOT NULL
      THEN (v_fecha_primera_cuota + ((v_cantidad_cuotas - 1) || ' months')::interval)::date
      ELSE NULL
    END,
    v_usuario
  )
  RETURNING id INTO v_id_contrato;

  -- 6) tasas_penalidades_seguros — pun/pen quedan en null a propósito
  -- (pendiente de confirmación de dominio, ver mapeo) --------------------
  INSERT INTO tasas_penalidades_seguros (tea, id_usuario)
  VALUES (NULLIF(v_contrato->>'tea', '')::numeric, v_usuario)
  RETURNING id INTO v_id_tasas;

  -- 7) prenda -----------------------------------------------------------------
  INSERT INTO prenda (id_tramite, id_acreedor_prendario, id_contrato, id_tasas_penalidades, id_usuario)
  VALUES (v_id_tramite, v_id_persona_acreedor, v_id_contrato, v_id_tasas, v_usuario)
  RETURNING id INTO v_id_prenda;

  -- 8) cerrar el círculo: tramite.id_prenda -----------------------------------
  UPDATE tramite SET id_prenda = v_id_prenda WHERE id = v_id_tramite;

  RETURN v_id_tramite;
END;
$$;

GRANT EXECUTE ON FUNCTION guardar_tramite_completo(jsonb) TO authenticated;
