CREATE TABLE IF NOT EXISTS gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_registro TEXT NOT NULL,
  monto INTEGER NOT NULL DEFAULT 0 CHECK (monto >= 0),
  detalle TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha_registro
  ON gastos (fecha_registro DESC, id DESC);
