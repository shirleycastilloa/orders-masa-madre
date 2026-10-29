# Orders Masa Madre

Aplicación web mobile first para administrar órdenes de pan de masa madre.

## Estado

La estructura inicial del proyecto está preparada. La implementación se realizará por etapas:

1. Estructura local y versionamiento.
2. Conexión con Turso.
3. Modelo de datos, migraciones y seed.
4. API.
5. Interfaz mobile first.
6. Pruebas.
7. Despliegue en Render.

## Stack

- React + Vite.
- Node.js + Express.
- TypeScript.
- Turso/libSQL.
- GitHub.
- Render.

## Desarrollo local

Requisitos: Node.js 22 o superior y npm.

1. Copiar `.env.example` como `.env`.
2. Completar las variables de Turso cuando se llegue a la etapa de conexión.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev`.

La aplicación no tendrá autenticación ni autorización en esta primera versión. Cualquier persona con la URL podrá consultar y modificar los datos.

## Turso

Base remota configurada:

- Cuenta: `shirleycastilloa`
- Base: `orders-masa-madre`
- URL: `libsql://orders-masa-madre-shirleycastilloa.aws-us-east-1.turso.io`
- Región: `aws-us-east-1`

El token de acceso no se guarda en GitHub. Para ejecutar el backend localmente se debe definir `TURSO_AUTH_TOKEN` en el entorno local junto con `TURSO_DATABASE_URL`. La conexión puede verificarse con:

```powershell
npm run db:check
```

El script de verificación ejecuta una consulta mínima contra la base remota. Las migraciones y el seed se implementarán en la siguiente etapa.
