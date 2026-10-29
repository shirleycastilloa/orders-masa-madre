# Historial de cambios

## Versión 0.1.0 — 2026-10-29

Primera versión funcional publicada en Render.

- Se implementó el monorepo React/Vite + Express + TypeScript.
- Se conectó la aplicación a Turso/libSQL remoto.
- Se agregaron migraciones, índices, claves foráneas y seed idempotente.
- Se implementó el CRUD de clientes.
- Se implementó el CRUD de tipos de pan e ingredientes adicionales.
- Se implementó el registro, edición, completado y borrado físico de órdenes.
- Se agregaron órdenes activas agrupadas por mes/año e histórico agrupado por año/mes.
- Se agregó el estado de pago y el formato de monto en colones sin decimales.
- Se agregó la interfaz mobile first y el despliegue en Render Free.
- Se agregaron pruebas unitarias, de integración y end-to-end.
- Se corrigió “Agregar un nuevo cliente” eliminando el formulario HTML anidado dentro del formulario de orden.
- Se agregaron accesos superiores en la pantalla principal para clientes, tipos de pan e ingredientes adicionales.
- Se verificó la aplicación publicada, el health check y los endpoints principales en producción.

## Historial de commits por etapa

- `47f31a7` — estructura inicial, scripts y documentación base.
- `45fe871` — conexión remota con Turso.
- `fb8cb45` — migraciones y seed.
- `29f3f5f` — API y reglas de negocio.
- `5474df4` — interfaz mobile first.
- `7847528` — pruebas.
- `c98cc2a` — configuración de Render mediante Blueprint.
- `39075a0` — mantenimientos y corrección del alta rápida de cliente.
