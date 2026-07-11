# POS System

Sistema POS con backend, frontend, base de datos y herramientas de desarrollo usando Docker.

El objetivo de esta documentacion es que una persona que no conoce Docker o React pueda entender que se hizo, por que se hizo y como levantar el proyecto desde cero.

## Que contiene el proyecto

```text
pos-system/
├── .env.example              # Plantilla de variables de entorno
├── .gitignore                # Archivos que Git no debe subir
├── docker-compose.yml        # Define y levanta todo el entorno local
├── pos-backend/
│   ├── Dockerfile            # Imagen Docker del backend Spring Boot
│   ├── .dockerignore         # Archivos que no entran a la imagen del backend
│   ├── pom.xml
│   └── src/
└── pos-frontend/
    ├── Dockerfile            # Imagen Docker del frontend React/Vite
    ├── .dockerignore         # Archivos que no entran a la imagen del frontend
    ├── package.json
    └── src/
```

Servicios del sistema:

- `frontend`: aplicacion web en React + TypeScript + Vite.
- `backend`: API en Spring Boot.
- `db`: base de datos PostgreSQL.
- `pgadmin`: herramienta visual para administrar PostgreSQL en desarrollo.

## Conceptos basicos de Docker

**Imagen**

Una imagen es una plantilla para crear contenedores. Por ejemplo:

```text
postgres:16
node:22-alpine
eclipse-temurin:17-jdk-alpine
```

Esas imagenes traen software ya instalado. `postgres:16` trae PostgreSQL. `node:22-alpine` trae Node.js. `eclipse-temurin:17-jdk-alpine` trae Java 17 y herramientas para compilar.

**Contenedor**

Un contenedor es una instancia corriendo de una imagen. Si la imagen es la plantilla, el contenedor es el proceso real que esta vivo.

Ejemplo: el servicio `db` usa la imagen `postgres:16`, y Docker crea un contenedor de PostgreSQL a partir de esa imagen.

**Dockerfile**

Un `Dockerfile` explica como construir una imagen propia. En este proyecto hay uno para el backend y uno para el frontend.

**Docker Compose**

Docker Compose permite levantar varios contenedores juntos con un archivo `docker-compose.yml`. En lugar de correr muchos comandos manuales, se usa:

```bash
docker compose up -d
```

Ese comando levanta frontend, backend, PostgreSQL y pgAdmin.

**Volumen**

Un volumen guarda datos fuera del contenedor. Esto importa para la base de datos. Si el contenedor se borra, el volumen puede conservar los datos.

En este proyecto:

```yaml
volumes:
  pos_postgres_data:
```

**Red**

Docker Compose crea una red interna para que los servicios se comuniquen por nombre. Por eso el backend se conecta a PostgreSQL usando `db`, no `localhost`.

```text
jdbc:postgresql://db:5432/pos_db
```

Dentro de Docker, `db` es el nombre del servicio de PostgreSQL.

**Puerto**

Un puerto permite acceder desde tu computadora a un servicio dentro de Docker.

Ejemplo:

```yaml
ports:
  - "5173:5173"
```

Significa:

```text
puerto_de_tu_computadora:puerto_dentro_del_contenedor
```

Si abres `http://localhost:5173`, llegas al frontend dentro del contenedor.

## Requisitos

Instala:

- Git
- Docker Desktop o Docker Engine con Docker Compose
- Node.js y npm, solo si quieres correr React sin Docker
- Java 17, solo si quieres correr Spring Boot sin Docker

Verifica Docker:

```bash
docker --version
docker compose version
```

## Variables de entorno

Las variables de entorno permiten configurar el sistema sin escribir secretos dentro del codigo.

El archivo real se llama `.env` y no se sube a GitHub. La plantilla se llama `.env.example` y si debe subirse.

Crear `.env`:

```bash
cp .env.example .env
```

Editar `.env` y cambiar los placeholders:

```env
DB_PASSWORD=your_db_password
PGADMIN_PASSWORD=your_pgadmin_password
JWT_SECRET=your_base64_jwt_secret
BOOTSTRAP_ADMIN_PASSWORD=your_admin_password
```

Generar un `JWT_SECRET` valido:

```bash
openssl rand -base64 32
```

El `docker-compose.yml` usa esta sintaxis:

```yaml
${DB_NAME:?DB_NAME is required}
```

Eso significa: "usa la variable `DB_NAME`; si no existe, falla con este mensaje". Es mejor fallar rapido que levantar el sistema con configuracion incompleta.

## Levantar el proyecto

Desde la raiz:

```bash
docker compose up -d
```

Que significa:

- `docker compose`: usa el archivo `docker-compose.yml`.
- `up`: crea y levanta los servicios.
- `-d`: los deja corriendo en segundo plano.

Ver estado:

```bash
docker compose ps
```

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5433`
- pgAdmin: `http://localhost:5051`

Ver logs:

```bash
docker compose logs -f
```

Apagar:

```bash
docker compose down
```

Apagar y borrar datos locales de PostgreSQL:

```bash
docker compose down -v
```

Usa `down -v` con cuidado porque borra el volumen de la base de datos local.

## Desarrollo diario

Para trabajar normalmente en el proyecto, lo recomendado es:

- Base de datos en Docker.
- pgAdmin en Docker.
- Frontend en Docker con hot reload.
- Backend desde IntelliJ usando `PosBackendApplication.main()`.

Comando corto:

```bash
make dev
```

Ese comando ejecuta:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db pgadmin frontend
```

Despues abre el backend en IntelliJ y corre:

```java
PosBackendApplication.main()
```

No levantes el backend en Docker al mismo tiempo que IntelliJ, porque ambos intentan usar el puerto `8080`.

Otros comandos cortos:

```bash
make ps              # ver contenedores
make logs            # ver logs
make down            # apagar servicios
make up              # levantar todo, incluido backend en Docker
make build           # reconstruir imagenes
make restart-frontend
```

## Hot reload del frontend con Docker

El `docker-compose.yml` base construye la imagen del frontend copiando el codigo. Eso sirve para validar que la imagen funciona, pero si cambias archivos en `pos-frontend/src`, el contenedor no ve esos cambios automaticamente.

Para desarrollar React con hot reload dentro de Docker se usa `docker-compose.dev.yml`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d frontend
```

Ese archivo agrega volumenes al servicio `frontend`:

```yaml
volumes:
  - ./pos-frontend:/app
  - frontend_node_modules:/app/node_modules
```

Que significa:

- `./pos-frontend:/app`: monta tu carpeta local del frontend dentro del contenedor. Si editas `src/App.tsx`, el contenedor ve el cambio.
- `frontend_node_modules:/app/node_modules`: mantiene `node_modules` dentro de un volumen Docker para no mezclar dependencias del contenedor con tu sistema local.

Tambien agrega:

```yaml
CHOKIDAR_USEPOLLING: "true"
WATCHPACK_POLLING: "true"
```

Esto ayuda a que Vite detecte cambios en entornos donde Docker no notifica bien eventos de archivos, como Docker Desktop o WSL.

Para levantar todo el entorno con hot reload del frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Luego abre:

```text
http://localhost:5173
```

Ahora puedes editar archivos del frontend y Vite deberia actualizar el navegador automaticamente.

## Crear el frontend desde cero

El frontend se creo con Vite, React y TypeScript.

Desde la raiz del proyecto:

```bash
npm create vite@latest pos-frontend -- --template react-ts
cd pos-frontend
npm install
```

Que hace cada comando:

- `npm create vite@latest`: descarga el generador de proyectos de Vite.
- `pos-frontend`: nombre de la carpeta del frontend.
- `--template react-ts`: usa React con TypeScript.
- `npm install`: descarga las dependencias del frontend.

Correr frontend sin Docker:

```bash
cd pos-frontend
npm run dev
```

Validar build:

```bash
npm run build
```

Vite solo expone al navegador variables que empiezan con `VITE_`.

En este proyecto:

```env
VITE_API_URL=http://localhost:8080
```

En React:

```ts
const apiUrl = import.meta.env.VITE_API_URL
```

## Dockerfile del frontend explicado

Archivo: `pos-frontend/Dockerfile`

```dockerfile
FROM node:22-alpine
```

Usa una imagen ligera de Node.js version 22. `alpine` significa que esta basada en Alpine Linux, una distribucion pequena.

```dockerfile
WORKDIR /app
```

Crea y usa `/app` como carpeta de trabajo dentro del contenedor.

```dockerfile
COPY package*.json ./
```

Copia `package.json` y `package-lock.json` primero. Esto ayuda a Docker a cachear la instalacion de dependencias.

```dockerfile
RUN npm install
```

Instala las dependencias del frontend dentro de la imagen.

```dockerfile
COPY . .
```

Copia el resto del codigo del frontend.

```dockerfile
EXPOSE 5173
```

Documenta que el contenedor usa el puerto `5173`. No publica el puerto por si solo; la publicacion real se hace en `docker-compose.yml`.

```dockerfile
CMD ["npm", "run", "dev"]
```

Comando que corre cuando inicia el contenedor. Levanta Vite en modo desarrollo.

Este Dockerfile es para desarrollo. En produccion no se deberia usar `npm run dev`; lo correcto seria compilar con `npm run build` y servir los archivos con Nginx, Caddy o un CDN.

## Configuracion de Vite para Docker

Archivo: `pos-frontend/vite.config.ts`

```ts
server: {
  host: '0.0.0.0',
  port: 5173,
  strictPort: true,
}
```

Explicacion:

- `host: '0.0.0.0'`: permite que Vite escuche conexiones desde fuera del contenedor.
- `port: 5173`: puerto fijo del servidor Vite.
- `strictPort: true`: si el puerto esta ocupado, falla en vez de usar otro puerto.

Sin `host: '0.0.0.0'`, Vite podria escuchar solo dentro del contenedor y no seria accesible desde `localhost:5173`.

## Dockerfile del backend explicado

Archivo: `pos-backend/Dockerfile`

```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
```

Primera etapa de construccion. Usa Java 17 con JDK, necesario para compilar.

```dockerfile
WORKDIR /app
```

Carpeta de trabajo dentro del contenedor.

```dockerfile
COPY .mvn .mvn
COPY mvnw pom.xml ./
```

Copia archivos de Maven Wrapper y `pom.xml`. Esto permite descargar dependencias antes de copiar todo el codigo.

```dockerfile
RUN ./mvnw dependency:go-offline
```

Descarga dependencias Maven. Ayuda a aprovechar cache de Docker.

```dockerfile
COPY src src
```

Copia el codigo fuente del backend.

```dockerfile
RUN ./mvnw clean package -DskipTests
```

Compila el backend y genera el `.jar`. `-DskipTests` evita correr tests durante la construccion de la imagen.

```dockerfile
FROM eclipse-temurin:17-jre-alpine
```

Segunda etapa. Usa JRE, mas pequeno que JDK, suficiente para ejecutar el `.jar`.

```dockerfile
COPY --from=build /app/target/*.jar app.jar
```

Copia el `.jar` generado en la etapa `build`.

```dockerfile
EXPOSE 8080
```

Documenta que el backend escucha en el puerto `8080`.

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Arranca Spring Boot.

Este enfoque se llama `multi-stage build`: una etapa compila y otra ejecuta. Es mas limpio y deja una imagen final mas pequena.

## docker-compose.yml explicado

Archivo: `docker-compose.yml`

### Servicio db

```yaml
db:
  image: postgres:16
```

Crea una base de datos PostgreSQL version 16.

```yaml
environment:
  POSTGRES_DB: ${DB_NAME:?DB_NAME is required}
  POSTGRES_USER: ${DB_USER:?DB_USER is required}
  POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
```

Define nombre de base, usuario y password usando variables de `.env`.

```yaml
ports:
  - "${DB_PORT:?DB_PORT is required}:5432"
```

Publica PostgreSQL hacia tu computadora. Si `DB_PORT=5433`, accedes con `localhost:5433`, aunque dentro del contenedor PostgreSQL use `5432`.

```yaml
volumes:
  - pos_postgres_data:/var/lib/postgresql/data
```

Guarda los datos de PostgreSQL en un volumen para no perderlos al reiniciar el contenedor.

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
```

Comprueba si PostgreSQL esta listo para recibir conexiones.

Nota: se usa `$${POSTGRES_USER}` con doble `$` para que Docker Compose no intente resolverlo antes de tiempo. Queremos que esa variable se lea dentro del contenedor.

### Servicio backend

```yaml
backend:
  build:
    context: ./pos-backend
```

Construye la imagen usando el `Dockerfile` que esta en `pos-backend`.

```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/${DB_NAME:?DB_NAME is required}
```

El backend se conecta a PostgreSQL por la red interna de Docker. Por eso usa `db:5432`, no `localhost:5433`.

```yaml
depends_on:
  db:
    condition: service_healthy
```

El backend espera a que la base de datos este saludable antes de iniciar.

```yaml
ports:
  - "${BACKEND_PORT:?BACKEND_PORT is required}:8080"
```

Publica el backend en tu computadora. Si `BACKEND_PORT=8080`, abres `http://localhost:8080`.

### Servicio frontend

```yaml
frontend:
  build:
    context: ./pos-frontend
```

Construye la imagen usando el `Dockerfile` del frontend.

```yaml
environment:
  VITE_API_URL: ${VITE_API_URL:?VITE_API_URL is required}
```

Inyecta al frontend la URL del backend.

```yaml
ports:
  - "${FRONTEND_PORT:?FRONTEND_PORT is required}:5173"
```

Publica Vite en tu computadora. Si `FRONTEND_PORT=5173`, abres `http://localhost:5173`.

### Servicio pgadmin

```yaml
pgadmin:
  image: dpage/pgadmin4
```

Levanta pgAdmin para administrar PostgreSQL desde navegador.

```yaml
PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:?PGADMIN_EMAIL is required}
PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:?PGADMIN_PASSWORD is required}
```

Credenciales iniciales de pgAdmin.

```yaml
ports:
  - "${PGADMIN_PORT:?PGADMIN_PORT is required}:80"
```

Si `PGADMIN_PORT=5051`, pgAdmin queda en `http://localhost:5051`.

### Volumen y red

```yaml
volumes:
  pos_postgres_data:
```

Declara el volumen donde PostgreSQL guarda datos.

```yaml
networks:
  pos-network:
```

Declara la red donde viven los servicios. Docker Compose conecta los servicios a esta red.

## Por que el compose esta en la raiz

El sistema completo tiene frontend, backend, base de datos y pgAdmin. Por eso el `docker-compose.yml` vive en la raiz y no dentro de `pos-backend`.

Decision actual:

- Compose oficial: `docker-compose.yml` en la raiz.
- Variables oficiales: `.env` y `.env.example` en la raiz.
- Cada aplicacion tiene su propio `Dockerfile`.

Esto evita duplicar configuracion y permite levantar todo con un solo comando.

## .dockerignore explicado

`.dockerignore` funciona como `.gitignore`, pero para Docker. Evita copiar archivos innecesarios a la imagen.

Frontend:

```text
node_modules
dist
.git
.DS_Store
npm-debug.log*
```

Backend:

```text
target
.git
.env
.DS_Store
*.log
```

Esto hace las imagenes mas pequenas y evita meter archivos locales o secretos dentro de la imagen.

## Seguridad de archivos

No subas estos archivos a GitHub:

```text
.env
pos-backend/.env
node_modules/
dist/
target/
```

El `.gitignore` ya los ignora.

Antes de hacer commit:

```bash
git status --short --ignored
```

Los `.env` deben aparecer con `!!`:

```text
!! .env
```

Eso significa que Git los esta ignorando.

## Buenas practicas de seguridad

Para desarrollo local, esta configuracion esta bien. Para produccion faltan ajustes:

- No usar Vite dev server en produccion.
- Servir el frontend compilado con Nginx, Caddy o un CDN.
- No exponer PostgreSQL al host si no es necesario.
- No publicar pgAdmin en internet.
- Usar HTTPS.
- Guardar secretos en el entorno del servidor, CI/CD, Docker secrets o un gestor de secretos.
- Usar contrasenas fuertes.
- Configurar CORS de forma estricta.
- Agregar rate limiting para login y endpoints sensibles.
- Revisar logs y errores para no filtrar informacion interna.
- Ejecutar contenedores con usuarios no root cuando sea posible.
- Escanear imagenes por vulnerabilidades.

## Comandos utiles

Construir imagenes:

```bash
docker compose build
```

Levantar servicios:

```bash
docker compose up -d
```

Ver estado:

```bash
docker compose ps
```

Ver logs de todo:

```bash
docker compose logs -f
```

Ver logs de un servicio:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

Entrar a un contenedor:

```bash
docker compose exec backend sh
```

Reconstruir despues de cambios en Dockerfile o dependencias:

```bash
docker compose build
docker compose up -d
```

Apagar:

```bash
docker compose down
```

Apagar y borrar datos locales:

```bash
docker compose down -v
```

## Flujo desde cero

1. Clonar el repositorio.
2. Crear `.env` con `cp .env.example .env`.
3. Editar `.env` y cambiar passwords y `JWT_SECRET`.
4. Ejecutar `docker compose up -d`.
5. Abrir `http://localhost:5173`.
6. Revisar contenedores con `docker compose ps`.
7. Revisar logs con `docker compose logs -f` si algo falla.

Con eso queda levantado el entorno completo de desarrollo.
