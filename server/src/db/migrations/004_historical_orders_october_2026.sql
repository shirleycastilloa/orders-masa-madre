INSERT INTO tipos_pan (tipo) VALUES ('Bolla') ON CONFLICT(tipo) DO NOTHING;
INSERT INTO tipos_pan (tipo) VALUES ('Cuadrado') ON CONFLICT(tipo) DO NOTHING;
INSERT INTO ingredientes_adicionales (ingrediente) VALUES ('Semillas') ON CONFLICT(ingrediente) DO NOTHING;
INSERT INTO ingredientes_adicionales (ingrediente) VALUES ('Tradicional') ON CONFLICT(ingrediente) DO NOTHING;
INSERT INTO ingredientes_adicionales (ingrediente) VALUES ('Especias Italianas') ON CONFLICT(ingrediente) DO NOTHING;

INSERT INTO clientes (alias) VALUES ('Allanbrito') ON CONFLICT(alias) DO NOTHING;
INSERT INTO clientes (alias) VALUES ('Óscar Isa') ON CONFLICT(alias) DO NOTHING;
INSERT INTO clientes (alias) VALUES ('Alejandro Cetrenss') ON CONFLICT(alias) DO NOTHING;

INSERT INTO ordenes (cliente_id, fecha_registro, fecha_entrega, hora_entrega, tipo_pan_id, ingrediente_adicional_id, notas, monto_colones, pagada, activa)
SELECT c.id, '2026-10-16', '2026-10-21', '19:00', tp.id, ia.id, NULL, 4000, 0, 0
FROM clientes c, tipos_pan tp, ingredientes_adicionales ia
WHERE c.alias = 'Allanbrito' AND tp.tipo = 'Bolla' AND ia.ingrediente = 'Tradicional'
  AND NOT EXISTS (
    SELECT 1 FROM ordenes o
    WHERE o.cliente_id = c.id AND o.fecha_registro = '2026-10-16' AND o.fecha_entrega = '2026-10-21'
      AND o.hora_entrega = '19:00' AND o.tipo_pan_id = tp.id AND o.ingrediente_adicional_id = ia.id
      AND o.monto_colones = 4000
  );

INSERT INTO ordenes (cliente_id, fecha_registro, fecha_entrega, hora_entrega, tipo_pan_id, ingrediente_adicional_id, notas, monto_colones, pagada, activa)
SELECT c.id, '2026-10-15', '2026-10-20', '21:00', tp.id, ia.id, NULL, 4500, 0, 0
FROM clientes c, tipos_pan tp, ingredientes_adicionales ia
WHERE c.alias = 'Óscar Isa' AND tp.tipo = 'Bolla' AND ia.ingrediente = 'Semillas'
  AND NOT EXISTS (
    SELECT 1 FROM ordenes o
    WHERE o.cliente_id = c.id AND o.fecha_registro = '2026-10-15' AND o.fecha_entrega = '2026-10-20'
      AND o.hora_entrega = '21:00' AND o.tipo_pan_id = tp.id AND o.ingrediente_adicional_id = ia.id
      AND o.monto_colones = 4500
  );

INSERT INTO ordenes (cliente_id, fecha_registro, fecha_entrega, hora_entrega, tipo_pan_id, ingrediente_adicional_id, notas, monto_colones, pagada, activa)
SELECT c.id, '2026-10-17', '2026-10-24', '09:00', tp.id, ia.id, NULL, 4000, 0, 0
FROM clientes c, tipos_pan tp, ingredientes_adicionales ia
WHERE c.alias = 'Alejandro Cetrenss' AND tp.tipo = 'Bolla' AND ia.ingrediente = 'Tradicional'
  AND NOT EXISTS (
    SELECT 1 FROM ordenes o
    WHERE o.cliente_id = c.id AND o.fecha_registro = '2026-10-17' AND o.fecha_entrega = '2026-10-24'
      AND o.hora_entrega = '09:00' AND o.tipo_pan_id = tp.id AND o.ingrediente_adicional_id = ia.id
      AND o.monto_colones = 4000
  );

INSERT INTO ordenes (cliente_id, fecha_registro, fecha_entrega, hora_entrega, tipo_pan_id, ingrediente_adicional_id, notas, monto_colones, pagada, activa)
SELECT c.id, '2026-10-17', '2026-10-24', '09:00', tp.id, ia.id, NULL, 4500, 0, 0
FROM clientes c, tipos_pan tp, ingredientes_adicionales ia
WHERE c.alias = 'Alejandro Cetrenss' AND tp.tipo = 'Cuadrado' AND ia.ingrediente = 'Especias Italianas'
  AND NOT EXISTS (
    SELECT 1 FROM ordenes o
    WHERE o.cliente_id = c.id AND o.fecha_registro = '2026-10-17' AND o.fecha_entrega = '2026-10-24'
      AND o.hora_entrega = '09:00' AND o.tipo_pan_id = tp.id AND o.ingrediente_adicional_id = ia.id
      AND o.monto_colones = 4500
  );
