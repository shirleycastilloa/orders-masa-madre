# Especificación técnica — Sistema de órdenes de pan de masa madre

## 1. Objetivo

Construir una aplicación web mobile first para registrar, consultar y administrar órdenes de pan de masa madre de varios clientes.

La aplicación permitirá:

- Registrar clientes y seleccionarlos al crear una orden.
- Mantener catálogos de tipos de pan e ingredientes adicionales.
- Crear, consultar, editar y eliminar órdenes.
- Marcar una orden como completada, trasladándola de activas a históricas.
- Mostrar las órdenes activas agrupadas por mes de entrega.
- Consultar el histórico agrupado por año/mes y ordenado por fecha de registro.
- Persistir toda la información en una base de datos remota Turso.
- Versionar el código en GitHub bajo el usuario shirleycastilloa.
- Desplegar la aplicación en Render usando el plan gratuito.

## 2. Arquitectura propuesta

### 2.1 Arquitectura general

Se utilizará un monorepo con un único servicio desplegable:

~~~text
Navegador móvil o escritorio
        |
        | HTTPS / JSON
        v
Render Web Service
  ├── Express: API REST y servidor de archivos estáticos
  └── React/Vite: interfaz web compilada
        |
        | HTTPS libSQL
        v
Turso Cloud: base de datos remota
~~~

Esta arquitectura evita CORS entre frontend y backend en producción y permite desplegar frontend y API como una sola aplicación gratuita.

### 2.2 Stack tecnológico

- Lenguaje: TypeScript.
- Frontend: React + Vite.
- Estilos: CSS propio con variables de diseño y enfoque responsive mobile first.
- Backend: Node.js + Express.
- Base de datos: Turso Cloud/libSQL remoto.
- Cliente de base de datos: @libsql/client.
- ORM recomendado: Drizzle ORM para esquema tipado y migraciones. También se puede usar @libsql/client directamente con SQL parametrizado.
- Validación: Zod compartido entre API y frontend.
- Pruebas: Vitest para unitarias y Playwright para flujos de navegador.
- Calidad: ESLint + Prettier.
- Versionamiento: Git/GitHub.
- Hosting: Render Free Web Service.

La conexión a Turso se ejecutará únicamente en el servidor. TURSO_DATABASE_URL y TURSO_AUTH_TOKEN nunca se expondrán al navegador ni llevarán prefijo público. El cliente oficial de libSQL documenta la creación del cliente con URL y token: https://github.com/tursodatabase/libsql-client-ts

No se usará un archivo SQLite local como fuente de verdad: el filesystem de Render Free es efímero. La fuente de verdad será Turso remoto.

### 2.3 Seguridad y alcance

El requerimiento indica que no se necesita autenticación ni autorización. Por tanto, la URL pública de Render permitirá a cualquier persona con acceso a ella consultar y modificar clientes y órdenes.

Esto se acepta como decisión de alcance, pero debe aparecer en el README y en la entrega. El sistema no debe presentarse como adecuado para información confidencial o uso público sin control de acceso.

### 2.4 Restricciones gratuitas

Turso publica un plan Free de 0 USD/mes con límites de bases de datos, almacenamiento y lecturas/escrituras mensuales. Estos límites deben verificarse antes de desplegar: https://turso.tech/pricing

Render Free suspende un Web Service después de 15 minutos sin tráfico y el arranque posterior puede tardar aproximadamente un minuto. El filesystem local es efímero, por lo que no se debe guardar allí la base de datos ni archivos permanentes: https://render.com/docs/free

## 3. Modelo de datos

### 3.1 Clientes

| Campo | Tipo | Requerido | Regla |
|---|---|---:|---|
| id | entero | Sí | Llave primaria autogenerada |
| alias | texto | Sí | No vacío; se muestra en listados |
| nombre_completo | texto | No | Texto libre |
| email | texto | No | Si se captura, formato de correo válido |
| mobile | texto | No | Texto para conservar +, espacios y ceros |
| direccion | texto | No | Texto multilínea |
| notas | texto | No | Texto multilínea |

Reglas:

- El alias elimina espacios al inicio y al final.
- El alias no puede quedar vacío.
- Se recomienda que el alias sea único sin distinguir mayúsculas/minúsculas.
- Un cliente puede tener muchas órdenes.
- No se ofrece borrado de clientes mientras existan órdenes relacionadas; se permite editarlo.

### 3.2 Tipos de pan

| Campo | Tipo | Requerido | Regla |
|---|---|---:|---|
| id | entero | Sí | Llave primaria autogenerada |
| tipo | texto | Sí | Único y no vacío |

Seed inicial:

- Bolla
- Cuadrado

El catálogo debe poder editarse desde mantenimiento o configuración, no necesariamente desde la pantalla principal.

### 3.3 Ingredientes adicionales

| Campo | Tipo | Requerido | Regla |
|---|---|---:|---|
| id | entero | Sí | Llave primaria autogenerada |
| ingrediente | texto | Sí | Único y no vacío |

Seed inicial:

- Sin ingredientes adicionales
- Pasas
- Frutos rojos
- Cherrys
- Pistachos
- Semillas

Sin ingredientes adicionales es un registro normal del catálogo, no un valor nulo.

### 3.4 Órdenes

| Campo | Tipo lógico | Requerido | Regla |
|---|---|---:|---|
| id | entero | Sí | Llave primaria autogenerada |
| cliente_id | entero | Sí | Debe existir en clientes |
| fecha_registro | fecha | Sí | Se asigna con la fecha local de Guatemala al crear |
| fecha_entrega | fecha | Sí | Selector calendario |
| hora_entrega | hora | Sí | Selector de hora; pantalla am/pm |
| tipo_pan_id | entero | Sí | Debe existir en tipos_pan |
| ingrediente_adicional_id | entero | Sí | Debe existir en ingredientes_adicionales |
| monto_colones | entero | Sí | Entero positivo o cero; sin decimales |
| pagada | booleano | Sí | false por defecto |
| activa | booleano | Sí | true al crear; no es campo editable visible |

Reglas:

- El monto se almacena como entero, nunca como float.
- El valor 12,500 se guarda como 12500.
- La hora se almacena en formato HH:mm, aunque la interfaz muestre h:mm AM/PM.
- La fecha se almacena como YYYY-MM-DD, sin conversión UTC.
- activa=true aparece en la pantalla de inicio.
- Marcar como completada actualiza activa=false, sin borrar el registro.
- Eliminar ejecuta borrado físico permanente.
- Una orden completada puede consultarse, editarse o eliminarse.

## 4. Esquema SQL Turso

~~~sql
PRAGMA foreign_keys = ON;

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
~~~

Decisiones:

- Se usan enteros autoincrementales para IDs.
- Se usan llaves foráneas para evitar referencias inexistentes.
- No se usa ON DELETE CASCADE: borrar un catálogo no debe borrar órdenes históricas.
- Antes de borrar un catálogo se revisa si está utilizado.
- Las respuestas de API incluyen tanto IDs como nombres relacionados para permitir editar.

El seed debe usar inserciones idempotentes y no crear clientes ni órdenes de ejemplo en producción.

## 5. API REST

Todas las respuestas son JSON. Formato de éxito:

~~~json
{
  "data": {},
  "error": null
}
~~~

Formato de validación:

~~~json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisa los campos marcados.",
    "fields": {
      "alias": "El alias es obligatorio."
    }
  }
}
~~~

### 5.1 Salud y catálogos

- GET /api/health: responde 200 si la aplicación está viva; no expone secretos.
- GET /api/catalogos: devuelve tipos de pan e ingredientes ordenados alfabéticamente.

### 5.2 Clientes

- GET /api/clientes?search=: lista por alias y permite filtrar por alias o nombre.
- GET /api/clientes/:id: detalle.
- POST /api/clientes: requiere alias; el resto es opcional.
- PATCH /api/clientes/:id: actualiza los campos enviados.

### 5.3 Órdenes

- GET /api/ordenes/activas: solo activa=1, ordenadas por fecha y hora de entrega ascendente.
- GET /api/ordenes/historico: solo activa=0, ordenadas por fecha_registro descendente.
- GET /api/ordenes/:id: todos los datos de la orden y nombres relacionados.
- POST /api/ordenes: crea, genera fecha_registro en servidor y fija activa=1.
- PATCH /api/ordenes/:id: actualiza cliente, entrega, tipo, ingrediente, monto y pago.
- PATCH /api/ordenes/:id/completar: fija activa=0 y es idempotente.
- DELETE /api/ordenes/:id: elimina físicamente y devuelve 204 o éxito equivalente.

La API no permite que el cliente cambie id, fecha_registro o activa desde el endpoint de edición normal.

### 5.4 Validación de backend

Validar siempre en servidor:

- Alias no vacío.
- IDs enteros y existentes.
- Fecha YYYY-MM-DD válida.
- Hora HH:mm válida.
- Monto entero mayor o igual a cero.
- pagada como booleano.
- Rechazo de propiedades desconocidas si se utiliza esquema estricto.
- Consultas parametrizadas.

## 6. Experiencia mobile first

### 6.1 Principios

- Diseñar primero para 360–430 px.
- Una columna en móvil; más columnas solo en tablet/escritorio.
- Área táctil mínima aproximada de 44 × 44 px.
- Alto contraste y estados que no dependan solo del color.
- Labels persistentes en formularios.
- Mensajes de carga, vacío, error y éxito.
- No depender de hover.
- Sin desplazamiento horizontal.

### 6.2 Pantalla de inicio

Ruta: /.

Orden:

1. Encabezado con nombre de la aplicación.
2. Barra superior con:
   - + Registrar orden.
   - Histórico.
3. Estado de carga/error.
4. Lista de órdenes activas.

Cada tarjeta muestra:

- Alias.
- Fecha de entrega.
- Hora en am/pm.
- Tipo de pan.
- Ingrediente adicional.
- Monto con separador de miles y sin decimales.
- Pagada o Pendiente con texto y color/icono.

Comportamiento:

- Solo aparecen órdenes activa=true.
- Se ordenan de fecha/hora más cercana a más lejana.
- Se agrupan por mes y año, por ejemplo Noviembre 2026.
- Tocar una tarjeta navega a /ordenes/:id.
- Si no hay órdenes, se muestra un estado vacío con Registrar orden.
- Después de una mutación se vuelve a consultar la API.

### 6.3 Pantalla registrar orden

Ruta: /ordenes/nueva.

Campos:

1. Cliente: selector con búsqueda por alias y acción + Nuevo cliente.
2. Fecha de entrega: selector calendario.
3. Hora de entrega: selector de hora; presentación am/pm.
4. Tipo de pan: selector.
5. Ingredientes adicionales: selector.
6. Monto a pagar: entrada controlada, con miles y sin decimales.
7. ¿Ya pagó?: checkbox desmarcado por defecto.
8. Fecha de registro: informativa y no editable; la define el servidor.

Acciones:

- Guardar orden.
- Cancelar.

Mientras guarda, se deshabilita el botón. Al terminar, se muestra confirmación y se navega al detalle o inicio.

### 6.4 Pantalla detalle/edición

Ruta: /ordenes/:id.

Mostrar todos los campos:

- ID.
- Cliente y datos disponibles.
- Fecha de registro.
- Fecha y hora de entrega.
- Tipo de pan.
- Ingrediente.
- Monto.
- Estado de pago.
- Estado activa/completada como información, no como selector.

Acciones:

- Guardar cambios.
- Marcar como completada si está activa.
- Eliminar orden.
- Volver.

Completar pide confirmación y actualiza activa=false. Eliminar pide confirmación explícita de que es permanente. Si el registro no existe, mostrar Orden no encontrada.

### 6.5 Pantalla histórico

Ruta: /historial.

Mostrar solo activa=false con esta jerarquía:

~~~text
Año
  Mes
    Órdenes ordenadas por fecha de registro descendente
~~~

Cada tarjeta muestra los datos resumidos, fecha de registro y estado de pago. Debe poder abrirse para consultar o editar.

Incluir estado vacío y botón para volver a activas. La primera versión puede cargar todo; dejar preparada la API para paginación.

### 6.6 Clientes y catálogos

Para que registrar una orden sea operable se necesita:

- Crear cliente desde el selector.
- Editar cliente.
- Buscar clientes por alias.
- Crear y editar tipos de pan.
- Crear y editar ingredientes.
- Impedir borrar catálogos usados por órdenes.

Pueden implementarse en /clientes y /configuracion sin ocupar espacio en la barra principal.

## 7. Fechas, horas y montos

- Locale: es-GT.
- Zona horaria de negocio: America/Guatemala.
- Fecha de almacenamiento: YYYY-MM-DD.
- Fecha de presentación: dd/MM/yyyy.
- Hora de almacenamiento: HH:mm.
- Hora de presentación: h:mm a.
- Moneda: colones, sin decimales.
- La entrada 12,500 se normaliza a 12500 antes de enviar.
- La API nunca recibe el monto formateado con comas.
- Los meses se muestran en español con inicial mayúscula.
- Para agrupar, usar Intl.DateTimeFormat con month y year.

## 8. Estructura del repositorio

~~~text
orders-masa-madre/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── features/orders/
│   │   ├── features/clients/
│   │   ├── features/catalogs/
│   │   ├── pages/
│   │   ├── lib/api.ts
│   │   └── styles/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── db/client.ts
│   │   ├── db/schema.ts
│   │   ├── db/migrations/
│   │   ├── db/seed.ts
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── app.ts
│   └── package.json
├── shared/
│   └── src/schemas.ts
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── render.yaml
├── README.md
└── ESPECIFICACION-SISTEMA-ORDENES.md
~~~

## 9. Variables de entorno

Archivo local .env, nunca se sube:

~~~env
NODE_ENV=development
PORT=3000
TURSO_DATABASE_URL=libsql://nombre-db-usuario.turso.io
TURSO_AUTH_TOKEN=token-secreto
APP_TIMEZONE=America/Guatemala
~~~

Archivo .env.example, sí se sube sin secretos:

~~~env
NODE_ENV=development
PORT=3000
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
APP_TIMEZONE=America/Guatemala
~~~

Nunca guardar tokens en código, README, commits, variables públicas del frontend o logs.

## 10. Construcción por etapas

### Etapa 0 — Preparación

Entregables:

- Especificación aprobada.
- Nombre final del repositorio.
- Confirmación de moneda y monto entero.
- Confirmación de que la falta de autenticación es intencional.
- Definición de quién conocerá la URL pública.

Criterio: no quedan decisiones que cambien el modelo de datos.

### Etapa 1 — Inicialización local y GitHub

1. Crear TypeScript, frontend y backend.
2. Configurar scripts dev, build, start, lint, test, db:migrate y db:seed.
3. Crear .gitignore.
4. Crear README.
5. Inicializar Git y primer commit.
6. Crear el repositorio bajo shirleycastilloa, preferentemente orders-masa-madre.
7. Publicar main.

Comandos orientativos:

~~~powershell
git init
git add .
git commit -m "chore: inicializa estructura"
git branch -M main
git remote add origin https://github.com/shirleycastilloa/orders-masa-madre.git
git push -u origin main
~~~

Guía oficial: https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories

### Etapa 2 — Crear y conectar Turso

1. Crear o iniciar sesión en Turso.
2. Instalar el CLI.
3. Autenticarse.
4. Crear la base remota orders-masa-madre.
5. Obtener URL.
6. Crear token.
7. Guardar URL/token en .env local y Render.
8. Ejecutar migraciones.
9. Ejecutar seed.
10. Verificar tablas y catálogos.

Comandos orientativos:

~~~powershell
turso auth login
turso db create orders-masa-madre
turso db show orders-masa-madre --url
turso db tokens create orders-masa-madre
~~~

Confirmar el nombre exacto de los comandos con turso --help si el CLI cambió. Flujo documentado: https://orm.drizzle.team/docs/tutorials/drizzle-with-turso

Conexión:

~~~ts
import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
~~~

La aplicación debe fallar al arrancar con un mensaje claro si falta una variable.

### Etapa 3 — Migraciones y seed

1. Implementar esquema.
2. Crear migración versionada.
3. Crear seed idempotente.
4. Activar foreign keys.
5. Crear índices.
6. Probar CRUD de una orden.
7. Probar que completar conserva el registro con activa=0.

Criterio: una base Turso nueva queda lista solo ejecutando migraciones y seed.

### Etapa 4 — API y negocio

1. Crear rutas REST.
2. Crear validadores Zod.
3. Crear servicios de clientes, catálogos y órdenes.
4. Usar SQL parametrizado.
5. Implementar ordenamiento.
6. Implementar completar y borrado físico.
7. Crear health check.
8. Manejar errores sin filtrar secretos ni SQL interno.

Criterio: la API se prueba sin depender de la interfaz.

### Etapa 5 — Interfaz mobile first

1. Definir layout, colores y componentes táctiles.
2. Implementar inicio.
3. Implementar tarjetas agrupadas.
4. Implementar nueva orden.
5. Implementar creación rápida de cliente.
6. Implementar detalle/edición.
7. Implementar completar/eliminar.
8. Implementar histórico.
9. Implementar loading, error y vacío.
10. Verificar móvil, tablet y escritorio.

Criterio: los flujos principales funcionan desde teléfono sin zoom ni desplazamiento horizontal.

### Etapa 6 — Pruebas

Unitarias:

- Formateo y parseo de montos.
- Fechas y horas.
- Agrupación por mes/año.
- Validación de cliente y orden.
- Completado.

API:

- Crear cliente.
- Crear orden.
- Rechazar campos faltantes.
- Listar activas.
- Completar y encontrar en histórico.
- Editar.
- Eliminar y confirmar que no existe.

End-to-end:

1. Crear cliente.
2. Crear orden pagada.
3. Verla en inicio.
4. Editarla.
5. Completarla.
6. Verla en histórico.
7. Eliminarla.

Viewport mínimo:

- 360 × 800.
- 390 × 844.
- 768 × 1024.
- 1280 × 800.

### Etapa 7 — GitHub y Render

Preparación:

1. Confirmar código en main.
2. Confirmar .env ignorado.
3. Confirmar .env.example.
4. Ejecutar npm run build local.
5. Ejecutar npm start local.
6. Escuchar en 0.0.0.0 y usar process.env.PORT.
7. Confirmar GET /api/health.

Render recomienda crear New > Web Service y conectar el repositorio. Los pushes de la rama conectada pueden activar despliegues automáticos: https://render.com/docs/deploy-node-express-app

Configuración:

| Campo | Valor |
|---|---|
| Runtime | Node |
| Branch | main |
| Plan | Free |
| Build command | npm ci && npm run build && npm run db:migrate && npm run db:seed |
| Start command | npm start |
| Health check | /api/health |

Si migrar durante el build genera concurrencia, ejecutar migraciones manualmente contra Turso antes de desplegar. No ejecutar migraciones destructivas automáticamente.

Variables de Render:

~~~text
NODE_ENV=production
APP_TIMEZONE=America/Guatemala
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
~~~

No crear variables VITE_ con credenciales.

Validación posterior:

1. Abrir la URL onrender.com.
2. Consultar /api/health.
3. Crear una orden de prueba.
4. Editarla.
5. Completarla y verla en histórico.
6. Eliminarla y verificar el borrado.
7. Revisar logs sin secretos.
8. Confirmar tras redeploy que los datos siguen en Turso.
9. Documentar URL y fecha de despliegue.

## 11. Pruebas de aceptación

### Clientes

- Se crea con solo alias.
- Se edita.
- Alias vacío se rechaza en frontend y backend.

### Catálogos

- Existen Bolla y Cuadrado.
- Existen Pasas, Frutos rojos, Cherrys, Pistachos, Semillas y Sin ingredientes adicionales.
- Se pueden seleccionar en una orden.

### Órdenes

- Fecha de registro automática.
- Fecha y hora de entrega seleccionables.
- Hora visible en am/pm.
- Monto entero, con miles y sin decimales.
- Checkbox de pago persistente.
- Orden nueva activa.
- Inicio muestra solo activas.
- Activas ordenadas y agrupadas por mes/año.
- Tarjeta abre todos los datos.
- Se puede editar.
- Se puede completar y ver en histórico.
- Se puede eliminar y confirmar que ya no existe en Turso.

### Histórico

- Solo activa=false.
- Agrupado por año/mes.
- Ordenado por fecha de registro descendente.
- Tarjetas seleccionables.

### Operación

- Funciona en móvil sin desplazamiento horizontal.
- Conecta Turso mediante variables seguras.
- Render construye desde GitHub.
- Redeploy no elimina órdenes.

## 12. Backlog priorizado

### P0 — Primera versión

- Monorepo y scripts.
- Conexión Turso.
- Migraciones y seed.
- CRUD mínimo de clientes.
- CRUD de órdenes.
- Completar y borrar.
- Inicio.
- Nueva orden.
- Detalle/edición.
- Histórico.
- Validaciones.
- Render + GitHub + variables de entorno.

### P1 — Operación cómoda

- Búsqueda de clientes.
- Mantenimiento de catálogos.
- Pruebas end-to-end.
- Accesibilidad básica.
- Manejo refinado de errores.
- Confirmaciones visuales.

### P2 — Futuro

- Filtros.
- Exportación CSV.
- Impresión.
- Recordatorios.
- Autenticación y autorización.
- Auditoría de cambios.
- Copias de seguridad avanzadas.

## 13. Definición de terminado

El sistema está listo cuando:

1. El código está en github.com/shirleycastilloa/orders-masa-madre.
2. Turso tiene migraciones y catálogos iniciales.
3. Render tiene una URL activa.
4. Crear, consultar, editar, completar y eliminar funcionan contra Turso.
5. Se cumplen los criterios de aceptación.
6. README contiene instalación, variables, despliegue y advertencia de no autenticación.
7. No hay secretos en el repositorio.
8. Las pruebas principales pasan.

