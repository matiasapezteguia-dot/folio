-- Ajustes de posición de impresión por campo, scopeados por usuario +
-- impresora + formulario + campo. Modelo aditivo: offset_x/offset_y se
-- SUMAN a la coordenada base calibrada del campo (CampoPDF.x/y en
-- src/types/pdf.ts), nunca la reemplazan. campo_id matchea CampoPDF.id
-- (hoy solo poblado en src/lib/pdf/templates/st03.ts).
--
-- Dos niveles de persistencia (ver hooks/usePrendaWizard.ts):
--   a) Sesión: offsets en memoria (Zustand), aplicados solo al trámite actual.
--   b) Default: fila acá, uno por (id_usuario, id_impresora, formulario,
--      campo_id) — se precarga la próxima vez que se imprime ese formulario
--      con esa impresora, y el usuario puede seguir ajustando por encima.
--
-- Ejecutar manualmente en Supabase → SQL Editor, DESPUÉS de impresora.sql
-- (referencia impresora(id) por FK).

CREATE TABLE IF NOT EXISTS campo_override (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario uuid NOT NULL,
  id_impresora uuid NOT NULL REFERENCES impresora(id),
  formulario varchar(50) NOT NULL,
  campo_id varchar(100) NOT NULL,
  offset_x numeric NOT NULL DEFAULT 0,
  offset_y numeric NOT NULL DEFAULT 0,
  fecha_creacion timestamptz DEFAULT now(),
  fecha_modificacion timestamptz,
  fecha_baja timestamptz
);

-- Un override activo por campo+impresora+formulario+usuario. La app hace
-- upsert contra esta clave (ver campoOverrideService.ts).
CREATE UNIQUE INDEX IF NOT EXISTS ux_campo_override_usuario_impresora_formulario_campo
  ON campo_override(id_usuario, id_impresora, formulario, campo_id);

ALTER TABLE campo_override ENABLE ROW LEVEL SECURITY;

-- Privado por usuario, mismo criterio que impresora: id_usuario sin FK a
-- auth.users (consistente con impresora.id_usuario), solo scopeado por RLS.
CREATE POLICY "select propio campo_override" ON campo_override
  FOR SELECT
  USING (auth.uid() = id_usuario);

CREATE POLICY "insert propio campo_override" ON campo_override
  FOR INSERT
  WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "update propio campo_override" ON campo_override
  FOR UPDATE
  USING (auth.uid() = id_usuario)
  WITH CHECK (auth.uid() = id_usuario);

-- Sin política de DELETE a propósito: soft delete vía fecha_baja (CLAUDE.md),
-- nunca DELETE físico.
