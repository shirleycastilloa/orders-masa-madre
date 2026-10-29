# Orders Masa Madre

Aplicación web mobile first para administrar órdenes de pan de masa madre de varios clientes.

## Estado actual

La primera versión funcional está implementada, probada y publicada en Render:

- Aplicación: [orders-masa-madre.onrender.com](https://orders-masa-madre.onrender.com)
- Repositorio: [github.com/shirleycastilloa/orders-masa-madre](https://github.com/shirleycastilloa/orders-masa-madre)
- Base de datos remota: Turso/libSQL
- Últimas funcionalidades incorporadas: notas específicas por orden y mantenimientos de clientes, tipos de pan e ingredientes adicionales.

La aplicación no tiene autenticación ni autorización por decisión de alcance. Cualquier persona que conozca la URL puede consultar y modificar la información.

## Funcionalidades implementadas

- Inicio con órdenes activas agrupadas por mes y año de entrega, ordenadas de la más cercana a la más lejana.
- Registro de órdenes con cliente, fecha, hora, tipo de pan, ingrediente adicional, monto en colones y estado de pago.
- Edición, eliminación física y marcado de órdenes como completadas.
- Histórico de órdenes agrupado por año/mes y ordenado por fecha de registro.
- En cada tarjeta activa se muestra el día de entrega debajo del alias y las notas de la orden antes del monto, con truncamiento visual en una línea.
- Mantenimiento de clientes desde la parte superior de la pantalla principal: crear, editar, buscar y eliminar cuando no tienen órdenes relacionadas.
- Mantenimiento de tipos de pan: crear, editar y eliminar cuando no están siendo utilizados.
- Mantenimiento de ingredientes adicionales: crear, editar y eliminar cuando no están siendo utilizados.
- Selector de hora con presentación AM/PM y montos con separador de miles sin decimales.
- Validación en frontend y backend.
- Health check disponible en `/api/health`.

La acción “Agregar un nuevo cliente” dentro de “Registrar orden” funciona mediante un panel independiente que permite capturar alias y nombre. El formulario de la orden incluye un campo de notas específico para esa orden. Se corrigió el problema de formularios HTML anidados que impedía enviar correctamente el alta del cliente; después de crearlo, queda seleccionado automáticamente en la orden.

## Stack

- React, Vite y TypeScript.
- Node.js y Express.
- Zod para validación.
- Turso/libSQL remoto mediante `@libsql/client`.
- Vitest para pruebas unitarias e integración.
- Playwright para pruebas end-to-end.
- GitHub para versionamiento.
- Render Free Web Service para producción.

## Desarrollo local

Requisitos: Node.js 22 o superior y npm.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

El archivo `.env` debe contener la URL de Turso y un token válido:

```env
NODE_ENV=development
PORT=3000
TURSO_DATABASE_URL=libsql://orders-masa-madre-shirleycastilloa.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=token-secreto-local
APP_TIMEZONE=America/Guatemala
```

El token es un secreto local: no debe escribirse en el código, en el frontend, en commits, en el README ni en logs. El archivo `.env` está excluido por `.gitignore`.

Comandos principales:

```powershell
npm run db:check
npm run db:migrate
npm run db:seed
npm run db:status
npm run build
npm start
```

## Turso

Base remota configurada para la aplicación:

- Cuenta: `shirleycastilloa`
- Base: `orders-masa-madre`
- Región: `aws-us-east-1`
- URL: `libsql://orders-masa-madre-shirleycastilloa.aws-us-east-1.turso.io`

Las migraciones crean las tablas `clientes`, `tipos_pan`, `ingredientes_adicionales`, `ordenes` y el control de migraciones. Las migraciones posteriores agregan `ordenes.notas` y eliminan la columna antigua de notas de clientes. El seed es idempotente e incluye Bolla, Cuadrado, Sin ingredientes adicionales, Pasas, Frutos rojos, Cherrys, Pistachos y Semillas.

## API principal

- `GET /api/health`
- `GET /api/clientes`
- `POST /api/clientes`
- `PATCH /api/clientes/:id`
- `DELETE /api/clientes/:id`
- `GET /api/catalogos`
- `POST|PATCH|DELETE /api/catalogos/tipos-pan`
- `POST|PATCH|DELETE /api/catalogos/ingredientes`
- `GET /api/ordenes/activas`
- `GET /api/ordenes/historico`
- `GET /api/ordenes/:id`
- `POST /api/ordenes`
- `PATCH /api/ordenes/:id`
- `PATCH /api/ordenes/:id/completar`
- `DELETE /api/ordenes/:id`

Los borrados de catálogos y clientes se rechazan cuando existen órdenes relacionadas, para proteger la integridad de los datos. Las órdenes, en cambio, se eliminan físicamente cuando se confirma su eliminación.

## Despliegue en Render

El servicio se conecta al repositorio de GitHub y despliega automáticamente los cambios de `main`. La configuración se encuentra en [`render.yaml`](render.yaml).

Configuración aplicada:

```text
Runtime: Node
Plan: Free
Región: Ohio
Branch: main
Build: npm ci --include=dev && npm run build && npm run db:migrate && npm run db:seed
Start: npm start
Health check: /api/health
```

Variables configuradas en Render:

- `NODE_ENV=production`
- `APP_TIMEZONE=America/Guatemala`
- `TURSO_DATABASE_URL=libsql://...`
- `TURSO_AUTH_TOKEN` como secreto no sincronizado con el repositorio.

El token de Turso debe agregarse desde Environment en Render. No se debe colocar en `render.yaml`, porque el archivo sí está versionado.

## Pruebas y calidad

```powershell
npm test
npm run test:e2e
npm run lint
npm run build
```

La suite end-to-end cubre el alta de una orden, el alta rápida de cliente y la navegación hacia los mantenimientos. Las pruebas de integración de API contra Turso usan datos temporales, los eliminan al terminar y utilizan tokens temporales invalidados después de la prueba.

## Etapas completadas

| Etapa | Resultado | Commit de referencia |
|---|---|---|
| 0. Preparación | Alcance, modelo y decisiones confirmadas | `47f31a7` |
| 1. GitHub y estructura | Monorepo, scripts y rama `main` | `47f31a7` |
| 2. Turso | Base remota y conexión configuradas | `45fe871` |
| 3. Migraciones y seed | Esquema, índices y catálogos iniciales | `fb8cb45` |
| 4. API | Clientes, catálogos, órdenes, histórico y validaciones | `29f3f5f` |
| 5. Interfaz | Flujo mobile first completo | `5474df4` |
| 6. Pruebas | Unitarias, integración y Playwright | `7847528` |
| 7. Render | Blueprint, health check y despliegue desde GitHub | `c98cc2a` |
| Actualización posterior | CRUD de clientes y catálogos; corrección de nuevo cliente | `39075a0` |
| Actualización posterior | Notas específicas por orden y migraciones 002/003 | Versión `0.1.1` |

El detalle funcional y técnico está en [`ESPECIFICACION-SISTEMA-ORDENES.md`](ESPECIFICACION-SISTEMA-ORDENES.md). El historial resumido de cambios está en [`CHANGELOG.md`](CHANGELOG.md).

## Alcance futuro

Filtros avanzados, exportación CSV, impresión, recordatorios, auditoría, respaldos avanzados y autenticación/autorización quedan fuera de esta primera versión.
