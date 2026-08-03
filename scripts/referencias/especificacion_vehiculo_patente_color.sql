-- Agrega patente y color a especificacion_vehiculo. Ambos campos ya se
-- piden en el wizard (VehiculoWizard.patente/color, Paso2Vehiculo.tsx, con
-- reglas DNTR de cuándo son obligatorios) pero no tenían columna en la base.
--
-- Confirmado por introspección de information_schema sobre las 25 tablas
-- del proyecto (cihdrbegtnplxpiffbwh) el 2026-08-02: ni "patente" ni
-- "dominio" ni "color" existían en ninguna tabla todavía.
--
-- ADD COLUMN IF NOT EXISTS lo hace seguro de correr aunque ya se haya
-- aplicado. No toca RLS: especificacion_vehiculo ya tiene su política
-- ("usuario ve sus vehiculos") y estas columnas quedan cubiertas por ella
-- igual que el resto de la tabla.
--
-- Ejecutar manualmente en Supabase → SQL Editor.

ALTER TABLE especificacion_vehiculo
  ADD COLUMN IF NOT EXISTS patente varchar(20),
  ADD COLUMN IF NOT EXISTS color varchar(50);
