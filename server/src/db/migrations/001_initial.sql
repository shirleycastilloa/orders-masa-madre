PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias TEXT NOT NULL COLLATE NOCASE UNIQUE,
  nombre_completo TEXT,
  email TEXT,
  mobile TEXT,
  direccion TEXT,
  notas TEXT
);

CREATE TABLE IF NOT EXISTS tipos_pan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL COLLATE NOCASE UNIQUE
);

CREATE TABLE IF NOT EXISTS ingredientes_adicionales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingrediente TEXT NOT NULL COLLATE NOCASE UNIQUE
);

CREATE TABLE IF NOT EXISTS ordenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  fecha_registro TEXT NOT NULL,
  fecha_entrega TEXT NOT NULL,
  hora_entrega TEXT NOT NULL,
  tipo_pan_id INTEGER NOT NULL,
  ingrediente_adicional_id INTEGER NOT NULL,
  monto_colones INTEGER NOT NULL DEFAULT 0 CHECK (monto_colones >= 0),
  pagada INTEGER NOT NULL DEFAULT 0 CHECK (pagada IN (0, 1)),
  activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (tipo_pan_id) REFERENCES tipos_pan(id),
  FOREIGN KEY (ingrediente_adicional_id) REFERENCES ingredientes_adicionales(id)
);

CREATE INDEX IF NOT EXISTS idx_ordenes_activas_entrega
  ON ordenes (activa, fecha_entrega, hora_entrega, id);

CREATE INDEX IF NOT EXISTS idx_ordenes_historicas_registro
  ON ordenes (activa, fecha_registro DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_ordenes_cliente
  ON ordenes (cliente_id);
