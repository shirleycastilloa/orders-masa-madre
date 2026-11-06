# Historial de cambios

## Versión 0.1.3 — 2026-11-06

- Se agregó el módulo de Gastos con la tabla `gastos` y la migración `005_expenses`.
- La pantalla principal ahora muestra los accesos `+ Orden`, `Histórico` y `Gastos`.
- Se agregó el registro de gastos con monto, detalle y fecha automática según `APP_TIMEZONE`.
- Se agregó el listado de gastos ordenado de la fecha más actual a la más antigua.
- Se agregó el resumen financiero con total de gastos, órdenes pagadas, órdenes pendientes, ganancias netas y ganancias brutas.
- Se agregaron pruebas E2E para consultar y registrar gastos.

## Versión 0.1.2 — 2026-10-31

- El Histórico se ordena por fecha de registro ascendente.
- Se agregaron resúmenes de montos Pagados y Pendientes para órdenes activas e históricas.
- Se agregó el menú responsive de mantenimientos y el botón azul “Regresar”.
- La migración `004_historical_orders_october_2026` agrega cuatro órdenes completadas de octubre de 2026, con sus clientes y catálogos faltantes sin duplicar registros existentes.

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

## Versión 0.1.1 — Notas por orden

- Las notas pasan del cliente a la orden mediante las migraciones `002_order_notes` y `003_remove_client_notes`.
- El registro y edición de órdenes incluyen el campo Notas.
- Las tarjetas activas, el histórico y el detalle muestran las notas específicas de cada orden.
- Los formularios de clientes dejan de capturar notas.

## Historial de commits por etapa

- `47f31a7` — estructura inicial, scripts y documentación base.
- `45fe871` — conexión remota con Turso.
- `fb8cb45` — migraciones y seed.
- `29f3f5f` — API y reglas de negocio.
- `5474df4` — interfaz mobile first.
- `7847528` — pruebas.
- `c98cc2a` — configuración de Render mediante Blueprint.
- `39075a0` — mantenimientos y corrección del alta rápida de cliente.
- `daa6397` — notas trasladadas de clientes a órdenes y migraciones 002/003.
- `45e1ac4` — notas con contenido resaltadas en rojo en las tarjetas.
