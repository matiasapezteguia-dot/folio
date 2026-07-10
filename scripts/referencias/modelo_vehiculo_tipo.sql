-- Tabla de tipos disponibles por modelo (cascada Marca → Modelo → Tipo).
-- El "tipo" de DNRPA es específico por combinación marca+modelo (ej. un mismo
-- modelo puede venir en "SEDAN 4 PUERTAS" y "SEDAN 3 PUERTAS"), por eso se
-- relaciona con modelo_vehiculo y no con el catálogo genérico tipo_vehiculo.
--
-- Ejecutar manualmente en Supabase → SQL Editor antes de correr
-- `npm run poblar-tipos` / cargar scripts/referencias/dnrpa_tipos.sql.

CREATE TABLE IF NOT EXISTS modelo_vehiculo_tipo (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_modelo uuid NOT NULL REFERENCES modelo_vehiculo(id),
  codigo_tipo varchar(3) NOT NULL,
  descripcion_tipo varchar(100) NOT NULL,
  fecha_creacion timestamptz DEFAULT now(),
  fecha_baja timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_modelo_vehiculo_tipo_modelo_codigo
  ON modelo_vehiculo_tipo(id_modelo, codigo_tipo);

ALTER TABLE modelo_vehiculo_tipo ENABLE ROW LEVEL SECURITY;

-- Mismo criterio que marca_vehiculo y modelo_vehiculo: catálogo compartido,
-- lectura pública sin restricción por usuario.
CREATE POLICY "select publico modelo_vehiculo_tipo" ON modelo_vehiculo_tipo
  FOR SELECT
  USING (true);
