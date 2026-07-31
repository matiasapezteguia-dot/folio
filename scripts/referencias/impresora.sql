-- Impresoras del usuario, con offset X/Y global de calibración (distinto del
-- ajuste por campo de campo_override.sql, que es más granular y se suma
-- encima de este offset global — ver comentario en ese archivo).
--
-- Generado a partir de la estructura real confirmada en Supabase (proyecto
-- cihdrbegtnplxpiffbwh) el 2026-07-30: la tabla ya existe ahí, creada a mano
-- desde el Table Editor, sin script — este archivo no tenía equivalente
-- previo en el repo. CREATE TABLE IF NOT EXISTS/DROP POLICY IF EXISTS lo
-- hacen seguro de correr aunque la tabla ya exista en el proyecto de destino.
--
-- Ejecutar manualmente en Supabase → SQL Editor, ANTES de campo_override.sql
-- (que la referencia con FK a impresora(id)).

CREATE TABLE IF NOT EXISTS impresora (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario uuid NOT NULL,
  nombre varchar(100) NOT NULL,
  offset_x numeric DEFAULT 0,
  offset_y numeric DEFAULT 0,
  fecha_creacion timestamptz DEFAULT now(),
  fecha_modificacion timestamptz,
  fecha_baja timestamptz
);

ALTER TABLE impresora ENABLE ROW LEVEL SECURITY;

-- Privado por usuario: id_usuario sin FK a auth.users (no hace falta para
-- que RLS funcione), solo scopeado por auth.uid().
DROP POLICY IF EXISTS "select propio impresora" ON impresora;
CREATE POLICY "select propio impresora" ON impresora
  FOR SELECT
  USING (auth.uid() = id_usuario);

DROP POLICY IF EXISTS "insert propio impresora" ON impresora;
CREATE POLICY "insert propio impresora" ON impresora
  FOR INSERT
  WITH CHECK (auth.uid() = id_usuario);

DROP POLICY IF EXISTS "update propio impresora" ON impresora;
CREATE POLICY "update propio impresora" ON impresora
  FOR UPDATE
  USING (auth.uid() = id_usuario)
  WITH CHECK (auth.uid() = id_usuario);

-- Sin política de DELETE a propósito: soft delete vía fecha_baja (CLAUDE.md),
-- nunca DELETE físico.
