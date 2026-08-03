-- Funciones auxiliares de find-or-create, extraídas de guardar_tramite_completo.sql
-- para no duplicar la lógica en actualizar_tramite_completo.sql (que la
-- necesita igual, para titulares y acreedor).
--
-- Mismo SECURITY INVOKER + SET search_path = public, extensions que el resto
-- de las funciones del proyecto. Ejecutar ANTES de guardar_tramite_completo.sql
-- y actualizar_tramite_completo.sql (ambas las llaman, necesitan existir
-- primero) — y necesitan unaccent instalada (guardar_tramite_completo.sql ya
-- la deja en el schema extensions).
--
-- p_forzar_actualizacion_domicilio (resolver_persona_humana y
-- resolver_persona_juridica): por default (false) el domicilio de una
-- persona encontrada por CUIT/DNI solo se completa si estaba en null —
-- correcto para el alta, para no pisar el domicilio de una persona
-- preexistente de otro trámite. Pero en una EDICIÓN, si el gestor corrige la
-- dirección de un titular/acreedor ya vinculado, ese campo ya no está en
-- null desde el primer guardado y nunca se actualizaría sin este flag.
-- guardar_tramite_completo.sql llama a los resolvers sin pasarlo (default
-- false, comportamiento de alta sin cambios); actualizar_tramite_completo.sql
-- lo pasa en true explícitamente. En true, el UPDATE corre siempre
-- (WHERE id = v_id_persona, sin el AND ..._IS NULL) — pero sigue siendo un
-- UPDATE normal sujeto a RLS: si la persona pertenece a otro gestor, afecta
-- 0 filas igual que hoy, el flag no bypasea nada, solo cambia CUÁNDO se
-- intenta el UPDATE.
--
-- IMPORTANTE al reaplicar esto: agregar un parámetro cambia la firma de la
-- función (nombre + tipos de argumentos) — CREATE OR REPLACE FUNCTION con
-- una firma distinta NO reemplaza la versión vieja, crea una sobrecarga
-- nueva al lado. Con el parámetro nuevo teniendo DEFAULT, llamar con la
-- cantidad de argumentos de antes quedaría ambiguo entre las dos versiones.
-- Por eso cada función auxiliar hace DROP FUNCTION IF EXISTS con la firma
-- vieja exacta antes del CREATE OR REPLACE con la firma nueva.
--
-- Ejecutar manualmente en Supabase → SQL Editor.

-- resolver_domicilio: find-or-create de domicilio por calle+numero+localidad+
-- provincia (case+acento insensitive vía unaccent, salvo numero) — mismo
-- criterio ya usado para titular y acreedor. Sin cambios en esta revisión.
CREATE OR REPLACE FUNCTION resolver_domicilio(
  p_calle text, p_numero text, p_localidad text, p_provincia text, p_usuario uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_id_domicilio uuid;
BEGIN
  SELECT id INTO v_id_domicilio FROM domicilio
    WHERE id_usuario = p_usuario
      AND unaccent(calle) ILIKE unaccent(p_calle)
      AND numero ILIKE p_numero
      AND unaccent(localidad) ILIKE unaccent(p_localidad)
      AND unaccent(coalesce(provincia, '')) ILIKE unaccent(coalesce(p_provincia, ''))
      AND fecha_baja IS NULL
    LIMIT 1;

  IF v_id_domicilio IS NULL THEN
    INSERT INTO domicilio (calle, numero, localidad, provincia, id_usuario)
    VALUES (NULLIF(p_calle, ''), NULLIF(p_numero, ''), NULLIF(p_localidad, ''), NULLIF(p_provincia, ''), p_usuario)
    RETURNING id INTO v_id_domicilio;
  END IF;

  RETURN v_id_domicilio;
END;
$$;

GRANT EXECUTE ON FUNCTION resolver_domicilio(text, text, text, text, uuid) TO authenticated;

-- resolver_persona_humana: find-or-create de persona tipo='humana' por
-- CUIT/DNI (separarCuitDni() reimplementado en SQL). Si el cuit/dni viene
-- vacío, RAISE EXCEPTION con el texto fijo
-- 'titular.cuitDni es obligatorio (%, sin dígitos)' — p_etiqueta_error aporta
-- solo la parte variable entre paréntesis (ej. 'titular en orden 1'), para
-- que el mensaje final quede byte a byte igual al que ya emitía
-- guardar_tramite_completo (tramiteService.mensajeErrorGuardarTramite en TS
-- matchea ese texto). La función no sabe nada de "titulares" ni "orden":
-- eso lo arma el llamador al construir p_etiqueta_error.
DROP FUNCTION IF EXISTS resolver_persona_humana(text, text, text, text, text, text, text, text, text, uuid, uuid, text);

CREATE OR REPLACE FUNCTION resolver_persona_humana(
  p_cuit_dni text,
  p_apellido text,
  p_nombre text,
  p_nacionalidad text,
  p_fecha_nacimiento text,
  p_profesion text,
  p_estado_civil text,
  p_telefono text,
  p_email text,
  p_id_domicilio uuid,
  p_usuario uuid,
  p_etiqueta_error text,
  p_forzar_actualizacion_domicilio boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_digitos text;
  v_cuit varchar;
  v_dni varchar;
  v_tipo_documento varchar;
  v_id_persona uuid;
BEGIN
  v_digitos := regexp_replace(coalesce(p_cuit_dni, ''), '\D', '', 'g');
  IF length(v_digitos) = 0 THEN
    RAISE EXCEPTION 'titular.cuitDni es obligatorio (%, sin dígitos)', p_etiqueta_error;
  END IF;

  IF length(v_digitos) = 11 THEN
    v_cuit := substr(v_digitos, 1, 2) || '-' || substr(v_digitos, 3, 8) || '-' || substr(v_digitos, 11, 1);
  ELSE
    v_dni := v_digitos;
    v_tipo_documento := 'DNI';
  END IF;

  SELECT id INTO v_id_persona FROM persona
    WHERE fecha_baja IS NULL
      AND ((v_cuit IS NOT NULL AND cuit = v_cuit) OR (v_dni IS NOT NULL AND dni = v_dni))
    LIMIT 1;

  IF v_id_persona IS NULL THEN
    INSERT INTO persona (
      tipo, cuit, dni, tipo_documento, apellido, nombre, nacionalidad,
      fecha_nacimiento, profesion, estado_civil, telefono, mail,
      id_domicilio_real, id_usuario
    ) VALUES (
      'humana', v_cuit, v_dni, coalesce(v_tipo_documento, 'DNI'),
      NULLIF(p_apellido, ''), NULLIF(p_nombre, ''), NULLIF(p_nacionalidad, ''),
      NULLIF(p_fecha_nacimiento, '')::date, NULLIF(p_profesion, ''), NULLIF(p_estado_civil, ''),
      NULLIF(p_telefono, ''), NULLIF(p_email, ''), p_id_domicilio, p_usuario
    )
    RETURNING id INTO v_id_persona;
  -- Si la persona encontrada por CUIT/DNI pertenece a otro gestor, este
  -- UPDATE afecta 0 filas por RLS ("usuario modifica sus personas":
  -- id_usuario = auth.uid()), sin error — esperado, no es un bug. El flag
  -- p_forzar_actualizacion_domicilio no cambia esto: solo decide cuándo se
  -- intenta el UPDATE, no bypasea RLS.
  ELSIF p_forzar_actualizacion_domicilio
     OR EXISTS (SELECT 1 FROM persona WHERE id = v_id_persona AND id_domicilio_real IS NULL) THEN
    UPDATE persona SET id_domicilio_real = p_id_domicilio WHERE id = v_id_persona;
  END IF;

  RETURN v_id_persona;
END;
$$;

GRANT EXECUTE ON FUNCTION resolver_persona_humana(text, text, text, text, text, text, text, text, text, uuid, uuid, text, boolean) TO authenticated;

-- resolver_persona_juridica: find-or-create del acreedor por CUIT (11
-- dígitos obligatorios, RAISE EXCEPTION explícito si no). NO actualiza
-- denominacion si la persona ya existía (mismo criterio no disruptivo que ya
-- tiene con id_domicilio_legal: solo completa lo que falta, nunca pisa datos
-- ya cargados por otro trámite/gestor) — confirmado a propósito, sin cambios
-- en esta revisión. id_domicilio_legal sí se puede forzar con
-- p_forzar_actualizacion_domicilio, mismo criterio que resolver_persona_humana.
DROP FUNCTION IF EXISTS resolver_persona_juridica(text, text, uuid, uuid);

CREATE OR REPLACE FUNCTION resolver_persona_juridica(
  p_cuit text,
  p_nombre text,
  p_id_domicilio uuid,
  p_usuario uuid,
  p_forzar_actualizacion_domicilio boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_digitos text;
  v_cuit_formateado varchar;
  v_id_persona uuid;
BEGIN
  v_digitos := regexp_replace(coalesce(p_cuit, ''), '\D', '', 'g');
  IF length(v_digitos) <> 11 THEN
    RAISE EXCEPTION 'financiera.acreedor.cuit debe tener 11 dígitos, recibido: %', p_cuit;
  END IF;
  v_cuit_formateado := substr(v_digitos, 1, 2) || '-' || substr(v_digitos, 3, 8) || '-' || substr(v_digitos, 11, 1);

  SELECT id INTO v_id_persona FROM persona
    WHERE fecha_baja IS NULL AND cuit = v_cuit_formateado
    LIMIT 1;

  IF v_id_persona IS NULL THEN
    INSERT INTO persona (tipo, cuit, denominacion, id_domicilio_legal, id_usuario)
    VALUES ('juridica', v_cuit_formateado, NULLIF(p_nombre, ''), p_id_domicilio, p_usuario)
    RETURNING id INTO v_id_persona;
  ELSIF p_forzar_actualizacion_domicilio
     OR EXISTS (SELECT 1 FROM persona WHERE id = v_id_persona AND id_domicilio_legal IS NULL) THEN
    UPDATE persona SET id_domicilio_legal = p_id_domicilio WHERE id = v_id_persona;
  END IF;

  RETURN v_id_persona;
END;
$$;

GRANT EXECUTE ON FUNCTION resolver_persona_juridica(text, text, uuid, uuid, boolean) TO authenticated;
