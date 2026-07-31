-- Ejecutar en Supabase → SQL Editor (proyecto compartido Sevilla/Jerez/Islantilla)
-- Añade lo necesario para que la tabla `celdas`/`comentarios` soporte Islantilla
-- sin afectar a las filas ya existentes de Sevilla y Jerez.

-- 1. Columnas nuevas en `celdas` para lugares por punto (lat/lng) en vez de row/col
ALTER TABLE celdas
  ADD COLUMN IF NOT EXISTS lugar_id     text,             -- id del lugar (ej: "bar-disparate"), como el row/col pero para Islantilla
  ADD COLUMN IF NOT EXISTS nombre_lugar text,
  ADD COLUMN IF NOT EXISTS categoria    text,
  ADD COLUMN IF NOT EXISTS lat          double precision,
  ADD COLUMN IF NOT EXISTS lng          double precision;

-- row/col son obligatorios en Sevilla/Jerez pero Islantilla no los usa: los hacemos opcionales
-- (no afecta a Sevilla/Jerez, que seguirán rellenándolos igual que siempre)
ALTER TABLE celdas ALTER COLUMN row DROP NOT NULL;
ALTER TABLE celdas ALTER COLUMN col DROP NOT NULL;

-- 2. `comentarios` no tenía columna `feria` (Jerez tampoco la usa hoy, es un riesgo ya
-- existente compartido con Sevilla). Se la añadimos y le sumamos lugar_id para Islantilla.
ALTER TABLE comentarios
  ADD COLUMN IF NOT EXISTS feria    text,
  ADD COLUMN IF NOT EXISTS lugar_id text;

ALTER TABLE comentarios ALTER COLUMN celda_row DROP NOT NULL;
ALTER TABLE comentarios ALTER COLUMN celda_col DROP NOT NULL;

-- 3. Índices para que las queries de Islantilla (filtradas por feria + lugar_id) vayan rápidas
CREATE INDEX IF NOT EXISTS idx_celdas_feria_lugar      ON celdas      (feria, lugar_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_feria_lugar ON comentarios (feria, lugar_id);
