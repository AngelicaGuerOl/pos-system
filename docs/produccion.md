# Produccion local de NovaPOS: explicacion completa de cambios

Este documento explica desde cero los cambios realizados para preparar NovaPOS para una instalacion local de produccion en Windows con Docker Desktop.

La guia operativa para instalar y usar la tienda esta en [store-deployment.md](store-deployment.md). Este archivo explica el "por que" y el "como funciona" de cada archivo nuevo o modificado.

No se modifico `.env`, no se cambiaron reglas de negocio, no se tocaron migraciones Flyway, no se cambiaron entidades, servicios, controladores, repositorios, pruebas ni dependencias.

## Objetivo tecnico

La instalacion de produccion local debe permitir abrir NovaPOS en:

```text
http://localhost
```

La arquitectura queda asi:

```text
Navegador Windows
  |
  | http://localhost
  v
frontend (Nginx, publicado solo en 127.0.0.1:80)
  |
  | /api -> http://backend:8080
  v
backend (Spring Boot, red interna Docker)
  |
  | jdbc:postgresql://db:5432/...
  v
db (PostgreSQL 16, red interna Docker, volumen persistente)
```

Solo `frontend` publica un puerto en la computadora. `backend` y `db` quedan internos dentro de Docker.

## Conceptos basicos

### Docker Compose base y override

El proyecto ya tenia `docker-compose.yml`, usado como base. Para produccion se agrego `docker-compose.prod.yml`.

Los comandos de produccion siempre usan ambos archivos:

```powershell
docker compose --env-file .env `
  -f docker-compose.yml `
  -f docker-compose.prod.yml
```

Compose lee primero `docker-compose.yml` y luego aplica los cambios del override `docker-compose.prod.yml`. Asi se conserva desarrollo y se cambia solo lo necesario para produccion.

### Volumen Docker

PostgreSQL guarda datos en un volumen Docker. Desarrollo usa `pos_postgres_data`; produccion usa otro volumen:

```text
pos_postgres_prod_data
```

Esto evita mezclar o borrar datos de desarrollo.

### Loopback

La produccion publica el frontend en `127.0.0.1`. Esa direccion solo responde desde la misma computadora.

Esto evita que NovaPOS quede disponible automaticamente para otros equipos de la red local.

### Nginx

En desarrollo, el frontend corre con Vite. En produccion, React se compila a archivos estaticos y Nginx los sirve.

Nginx tambien funciona como proxy: cuando el navegador pide `/api/...`, Nginx reenvia esa solicitud al backend interno.

## Archivos creados

## `docker-compose.prod.yml`

Este archivo convierte el Compose base en una instalacion local de produccion.

### `name: novapos-store`

Define el nombre del proyecto Compose de produccion. Esto ayuda a separar contenedores de tienda de contenedores de desarrollo.

### Servicio `db`

```yaml
db:
  ports: !reset []
```

El Compose base publicaba PostgreSQL al host. En produccion se eliminan esos puertos. PostgreSQL queda accesible solo por la red interna Docker.

```yaml
volumes:
  - pos_postgres_prod_data:/var/lib/postgresql/data
```

Cambia el volumen de datos. Produccion no reutiliza `pos_postgres_data` de desarrollo.

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
```

`pg_isready` verifica que PostgreSQL acepte conexiones. Se usa `$$` porque Compose interpreta `$`; con `$$` la variable llega al contenedor.

```yaml
restart: unless-stopped
```

Docker reinicia el servicio si falla o cuando Docker Desktop vuelve a arrancar, excepto si alguien lo detuvo manualmente.

### Servicio `backend`

```yaml
ports: !reset []
```

Elimina la publicacion del puerto `8080` al host. Nginx puede hablar con el backend por la red Docker usando el nombre `backend`.

```yaml
SPRING_PROFILES_ACTIVE: prod
```

Fuerza el perfil `prod` dentro del contenedor de produccion. Este perfil deshabilita Swagger y usa configuracion orientada a produccion.

```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/${DB_NAME:?DB_NAME is required}
```

El backend se conecta a PostgreSQL usando el nombre del servicio Docker `db`, no `localhost`.

```yaml
depends_on:
  db:
    condition: service_healthy
```

El backend espera a que `db` este saludable antes de iniciar.

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -q -S --spider http://localhost:8080/api/auth/me 2>&1 | grep -Eq 'HTTP/[0-9.]+ (200|401|403)'"]
```

No se agrego Spring Boot Actuator. El health check usa una ruta real. `/api/auth/me` puede devolver `401` porque requiere autenticacion; para este caso eso cuenta como saludable, porque demuestra que el servidor web del backend esta vivo y Spring Security respondio.

### Servicio `frontend`

```yaml
build:
  context: ./pos-frontend
  dockerfile: Dockerfile.prod
```

Produccion usa un Dockerfile nuevo para compilar React y servirlo con Nginx.

```yaml
args:
  VITE_API_BASE_URL: /api
```

Durante `npm run build`, Vite incrusta `/api` como URL base de API. Esto permite que el navegador llame al mismo host y que Nginx haga proxy.

```yaml
environment: !reset []
```

La imagen final es Nginx, no Vite. Ya no necesita variables `VITE_*` en runtime porque Vite las usa al compilar.

```yaml
ports: !override
  - "${NOVAPOS_BIND_ADDRESS:-127.0.0.1}:${NOVAPOS_FRONTEND_PORT:-80}:80"
```

Publica solo Nginx. Por defecto:

```text
127.0.0.1:80 -> contenedor frontend:80
```

Si `NOVAPOS_FRONTEND_PORT=80`, la URL es `http://localhost`.

```yaml
depends_on:
  backend:
    condition: service_healthy
```

El frontend espera a que el backend este saludable.

### Servicio `pgadmin`

```yaml
profiles:
  - dev-tools
```

`pgadmin` existe en el Compose base, pero en produccion normal no debe arrancar. Al ponerlo bajo un perfil que no se usa, no aparece en el arranque normal de produccion.

### Volumen

```yaml
volumes:
  pos_postgres_prod_data:
    name: pos_postgres_prod_data
```

Fija el nombre real del volumen. Asi no depende del nombre de la carpeta local.

## `pos-frontend/Dockerfile.prod`

Este Dockerfile crea una imagen final pequena y reproducible para produccion.

```dockerfile
FROM node:22-alpine AS build
```

Primera etapa: usa Node 22 Alpine, compatible con el Dockerfile de desarrollo y con el proyecto frontend.

```dockerfile
WORKDIR /app
```

Define `/app` como carpeta de trabajo dentro del contenedor.

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci
```

Copia primero los archivos de dependencias y usa `npm ci`. Esto respeta exactamente `package-lock.json` y es mas reproducible que `npm install`.

```dockerfile
COPY . .
```

Copia el codigo fuente despues de instalar dependencias. Esto mejora cache de Docker: si solo cambia codigo, no reinstala dependencias.

```dockerfile
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build
```

Define `/api` como API base durante la compilacion. `npm run build` ejecuta TypeScript y Vite, generando `dist`.

```dockerfile
FROM nginx:1.27-alpine
```

Segunda etapa: imagen final con Nginx. No incluye `node_modules`, Vite ni herramientas de desarrollo.

```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
```

Copia la configuracion Nginx y solo el resultado compilado.

```dockerfile
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Nginx escucha en el puerto 80 del contenedor y queda corriendo como proceso principal.

## `pos-frontend/nginx.conf`

Este archivo dice a Nginx como servir React y como reenviar `/api`.

```nginx
server {
    listen 80;
    server_name localhost;
```

Define un servidor HTTP en el puerto 80.

```nginx
root /usr/share/nginx/html;
index index.html;
```

Los archivos compilados de React se sirven desde esa carpeta.

```nginx
location = /index.html {
    add_header Cache-Control "no-store";
    try_files /index.html =404;
}
```

Evita cache prolongada de `index.html`, porque ese archivo apunta a los assets actuales.

```nginx
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}
```

Los assets generados por Vite tienen hash en el nombre. Se pueden cachear mucho tiempo.

```nginx
location /api/ {
    proxy_pass http://backend:8080;
```

Reenvia `/api/...` al backend. No se agrega una barra final en `proxy_pass`, para conservar el prefijo `/api` y evitar `/api/api`.

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

Encabezados usuales de proxy para que el backend reciba informacion correcta del origen.

```nginx
location ~ ^/(swagger-ui|v3/api-docs) {
    return 404;
}
```

Nginx no publica Swagger. Ademas, el perfil `prod` de Spring tambien lo deshabilita.

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Soporte para React Router. Si se abre una ruta como `/ventas`, Nginx devuelve `index.html` y React resuelve la ruta.

## `scripts/common.ps1`

Centraliza logica compartida por los scripts.

### Modo estricto

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
```

Hace que errores y variables mal usadas fallen temprano.

### Rutas comunes

```powershell
$Script:ProjectRoot = Split-Path -Parent $PSScriptRoot
$Script:EnvFile = Join-Path $Script:ProjectRoot ".env"
$Script:ComposeBaseFile = Join-Path $Script:ProjectRoot "docker-compose.yml"
$Script:ComposeProdFile = Join-Path $Script:ProjectRoot "docker-compose.prod.yml"
```

Permite ejecutar scripts desde cualquier carpeta. `$PSScriptRoot` apunta a `scripts/`; de ahi se sube a la raiz del proyecto.

### Argumentos comunes Compose

```powershell
$Script:ComposeArgs = @(
    "--env-file", $Script:EnvFile,
    "-f", $Script:ComposeBaseFile,
    "-f", $Script:ComposeProdFile
)
```

Garantiza que todos los scripts usen `.env`, `docker-compose.yml` y `docker-compose.prod.yml`.

### Variables requeridas

`$Script:RequiredEnvNames` lista las variables que el proyecto ya usa. Si falta una, los scripts muestran solo el nombre, nunca el valor.

### Funciones principales

- `Write-Info`: imprime mensajes uniformes.
- `Assert-Windows`: valida Windows.
- `Assert-FileExists`: valida archivos requeridos.
- `Invoke-Checked`: ejecuta comandos y falla si el codigo de salida no es cero.
- `Invoke-Compose`: ejecuta Docker Compose con los argumentos comunes.
- `Get-ComposeOutput`: obtiene salida de Compose para inspecciones.
- `Assert-DockerReady`: valida Docker, Docker Compose y Docker Desktop funcionando.
- `Get-EnvMap`: lee `.env` sin imprimir secretos.
- `Assert-RequiredEnv`: reporta nombres faltantes.
- `Get-StoreConfig`: calcula `http://localhost` o URL con puerto.
- `Wait-ForServices`: espera `db`, `backend` y `frontend`.
- `Test-FrontendUrl`: valida que el frontend responda.
- `Get-LastBackup`: busca el ultimo `.dump`.
- `Assert-BackupFile`: valida existencia y tamano de un respaldo.

## `scripts/install.ps1`

Instala la produccion local.

Pasos:

1. Valida Windows.
2. Verifica `.env` y archivos Compose.
3. Verifica Docker Desktop.
4. Valida variables requeridas.
5. Crea `C:\NovaPOS-Backups`.
6. Ejecuta `docker compose config --quiet`.
7. Construye `backend` y `frontend`.
8. Inicia `db`, `backend` y `frontend`.
9. Espera servicios.
10. Prueba el frontend.
11. Muestra URL.
12. Ofrece crear acceso directo.

No restaura datos, no borra bases, no elimina volumenes y no cambia `.env`.

## `scripts/start.ps1`

Inicia una instalacion existente:

```powershell
docker compose ... up -d db backend frontend
```

No reconstruye imagenes y no borra datos.

## `scripts/stop.ps1`

Detiene servicios:

```powershell
docker compose ... stop frontend backend db
```

Usa `stop`, no `down -v`. Los contenedores pueden iniciarse despues y el volumen queda intacto.

## `scripts/status.ps1`

Muestra:

- Estado de `db`.
- Estado de `backend`.
- Estado de `frontend`.
- Health check si existe.
- Existencia del volumen `pos_postgres_prod_data`.
- Ultimo `.dump` encontrado.
- URL local.

No muestra variables de entorno ni secretos.

## `scripts/logs.ps1`

Muestra logs:

```powershell
.\scripts\logs.ps1
.\scripts\logs.ps1 -Service backend
.\scripts\logs.ps1 -Service frontend -Follow
```

`ValidateSet` limita servicios validos a `db`, `backend` y `frontend`.

## `scripts/backup.ps1`

Crea respaldos PostgreSQL seguros para Windows.

Flujo:

1. Verifica Docker y `.env`.
2. Verifica que `db` este corriendo.
3. Crea un `.dump` dentro del contenedor con `pg_dump -Fc`.
4. Valida dentro del contenedor con `pg_restore -l`.
5. Copia al host con `docker compose cp`.
6. Verifica que el archivo exista y pese mas de cero bytes.
7. Si se envio `-CloudBackupDirectory`, copia el mismo `.dump` a esa carpeta externa o sincronizada con nube.
8. Borra temporal del contenedor en `finally`.

No usa tuberias PowerShell para transportar el binario.

Ubicacion por defecto:

```text
C:\NovaPOS-Backups
```

Ejemplo con copia adicional a Google Drive:

```powershell
.\scripts\backup.ps1 `
  -BackupDirectory "C:\NovaPOS-Backups" `
  -CloudBackupDirectory "G:\Mi unidad\NovaPOS-Backups"
```

## `scripts/restore.ps1`

Restaura un `.dump` con protecciones.

Uso:

```powershell
.\scripts\restore.ps1 -BackupFile "C:\NovaPOS-Backups\novapos-fecha.dump"
```

Protecciones:

- `-BackupFile` es obligatorio.
- Valida que el archivo exista y no este vacio.
- Pide escribir exactamente `RESTORE`.
- Crea respaldo de seguridad antes de restaurar.
- Si el respaldo de seguridad falla, cancela.
- Detiene `frontend` y `backend`.
- Mantiene `db` activo.
- Copia el dump con `docker compose cp`.
- Valida con `pg_restore -l`.
- Cierra conexiones activas.
- Restaura con `--clean --if-exists --no-owner --no-privileges --single-transaction`.
- Limpia temporales en `finally`.
- Reinicia backend/frontend solo despues de restaurar.
- Muestra checklist de verificacion.

## `scripts/update.ps1`

Actualiza usando el codigo que ya esta en la computadora.

Sin `-Pull`:

1. Crea respaldo obligatorio.
2. Cancela si el respaldo falla.
3. Valida Compose.
4. Reconstruye imagenes.
5. Reinicia servicios.
6. Deja que Flyway aplique migraciones pendientes al iniciar backend.
7. Verifica frontend.

Con `-Pull`:

1. Valida Git.
2. Confirma que sea repo Git.
3. Exige repo limpio.
4. Ejecuta solo:

```text
git pull --ff-only
```

No usa `git reset`, `git clean`, force pull ni checkout forzado.

## `scripts/create-shortcut.ps1`

Crea un archivo `.url` llamado `NovaPOS` en el escritorio.

No depende de Chrome. Windows abre la URL con el navegador predeterminado.

Con `-IncludeStartShortcut`, crea tambien un acceso directo que ejecuta `start.ps1`.

## `scripts/register-backup-task.ps1`

Registra una tarea diaria en el Programador de tareas de Windows.

Nombre:

```text
NovaPOS Daily Backup
```

Hora por defecto, tomada en la zona horaria local configurada en Windows:

```text
12:30
```

No guarda contrasenas. Si la tarea ya existe, pide confirmacion con `REPLACE`.

Tambien acepta `-BackupDirectory` y `-CloudBackupDirectory` para que la tarea diaria cree el respaldo local y copie el mismo archivo a Google Drive, OneDrive, una USB o una carpeta de red.

## Archivos modificados

## `.env.example`

Se agregaron:

```env
NOVAPOS_BIND_ADDRESS=127.0.0.1
NOVAPOS_FRONTEND_PORT=80
```

Son valores publicos, no secretos. Sirven para controlar donde se publica Nginx en produccion local.

## `.gitignore`

Se agregaron:

```gitignore
backups/
NovaPOS-Backups/
*.dump
*.backup
```

Evitan subir respaldos al repositorio por accidente. `C:\NovaPOS-Backups` esta fuera del repositorio, pero los patrones siguen siendo utiles si alguien copia dumps dentro de la carpeta del proyecto.

## `README.md`

Se agrego enlace a la guia de instalacion local de tienda y se elimino la mejora futura de "Production-optimized frontend container", porque ya existe `Dockerfile.prod`.

## `docs/README.md`

Se agrego enlace a `store-deployment.md`.

## `docs/architecture.md`

Se aclaro la diferencia:

- Desarrollo: frontend con Vite.
- Produccion local: frontend compilado servido por Nginx.

Tambien se documento que Nginx reenvia `/api` al backend interno.

## `docs/installation.md`

Se mantuvo como guia de desarrollo y se agrego referencia a la guia de tienda.

## `docs/backup-restore.md`

Se mantuvieron comandos de desarrollo y se agrego referencia a:

```powershell
.\scripts\backup.ps1
.\scripts\restore.ps1
```

## `docs/security.md`

Se agrego la aclaracion de produccion local:

- Perfil `prod`.
- Swagger deshabilitado.
- Solo frontend publicado en loopback.
- Backend y PostgreSQL internos.
- Sin exposicion a Internet.

## Comandos ejecutados durante la verificacion

### Estado y exploracion

```bash
pwd
rg --files
git status --short
```

Sirvieron para ubicar el repo, listar archivos y ver cambios pendientes.

### Lectura de archivos

```bash
sed -n '1,240p' docker-compose.yml
sed -n '1,260p' docker-compose.dev.yml
sed -n '1,240p' .env.example
sed -n '1,240p' .gitignore
sed -n '1,260p' pos-backend/Dockerfile
sed -n '1,260p' pos-frontend/Dockerfile
sed -n '1,260p' pos-backend/pom.xml
sed -n '1,220p' pos-frontend/package.json
```

Sirvieron para respetar versiones reales, variables reales, servicios reales y herramientas reales.

### Revision de Spring y frontend

```bash
sed -n '1,260p' pos-backend/src/main/resources/application.yml
sed -n '1,260p' pos-backend/src/main/resources/application-dev.yml
sed -n '1,260p' pos-backend/src/main/resources/application-prod.yml
sed -n '1,260p' pos-backend/src/main/resources/application-test.yml
sed -n '1,220p' pos-frontend/src/app/config/env.ts
sed -n '1,260p' pos-frontend/src/shared/api/httpClient.ts
sed -n '1,240p' pos-backend/src/main/java/com/angelica/pos/security/SecurityConfig.java
```

Sirvieron para confirmar:

- Perfil `prod`.
- Swagger deshabilitado.
- CORS existente.
- JWT por variables.
- `VITE_API_BASE_URL`.
- Cliente HTTP con base URL configurable.
- Endpoints bajo `/api`.

### Validacion Compose

```bash
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml config --quiet
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml config --services
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml config --volumes
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml config --format json
```

Confirmaron:

- Compose es valido.
- Servicios finales: `db`, `backend`, `frontend`.
- Volumen final: `pos_postgres_prod_data`.
- Solo frontend publica puerto.
- `db` y `backend` no publican puertos.
- No hay bind mounts de codigo fuente en produccion.

Nota: la salida JSON de Compose contiene valores de entorno resueltos, por eso no debe copiarse a documentacion publica.

### Verificacion frontend

```bash
cd pos-frontend
npm ci
npm run lint
npm run build
```

Confirmaron:

- `package-lock.json` es usable.
- Lint pasa.
- Vite genera `dist`.

Vite mostro una advertencia de bundle grande. No bloquea el build.

### Validacion Nginx

```bash
docker run --rm --add-host backend:127.0.0.1 \
  -v /home/ngelica_uerrero/pos-system/pos-frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:1.27-alpine nginx -t
```

Sirvio para validar sintaxis de Nginx. Se uso `--add-host backend:127.0.0.1` porque fuera de Docker Compose no existe el nombre interno `backend`.

### Docker builds

```bash
docker build -f pos-frontend/Dockerfile.prod pos-frontend
docker build pos-backend
```

Confirmaron que las imagenes se pueden construir sin iniciar servicios ni crear volumenes.

El build backend usa el Dockerfile existente y ejecuta `./mvnw clean package -DskipTests`, como ya estaba definido.

### Backend local

```bash
cd pos-backend
./mvnw clean verify
```

No pudo ejecutarse en este entorno porque `JAVA_HOME` no esta configurado correctamente. El build Docker del backend si fue exitoso.

### Revision de seguridad de cambios

```bash
rg -n "down\\s+-v|docker volume rm|docker volume prune|Remove-Item|rm -rf|git reset|git clean|checkout --force|force pull|pgAdmin|npm run dev" ...
git diff --check
git diff -- .env
```

Sirvieron para confirmar:

- No se agrego `docker compose down -v` en scripts.
- No se eliminan volumenes.
- No hay comandos destructivos automaticos.
- `update.ps1 -Pull` usa `git pull --ff-only`.
- No hay whitespace invalidos.
- `.env` no fue modificado.

## Que no se ejecuto

No se ejecuto:

```powershell
.\scripts\install.ps1
.\scripts\restore.ps1
.\scripts\update.ps1
```

No se inicio la instalacion de produccion, no se restauraron datos, no se borraron contenedores y no se borraron volumenes.

## Como probar despues sin afectar desarrollo

En Windows:

```powershell
docker compose --env-file .env `
  -f docker-compose.yml `
  -f docker-compose.prod.yml `
  config
```

Luego:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\install.ps1
```

Para detener sin borrar datos:

```powershell
.\scripts\stop.ps1
```

Nunca uses:

```text
docker compose down -v
```

## Resumen de decisiones

- No se toca desarrollo.
- No se toca `.env`.
- Produccion usa `docker-compose.yml` + `docker-compose.prod.yml`.
- Frontend productivo usa Nginx.
- API queda bajo `/api`.
- Backend y PostgreSQL son internos.
- Solo `frontend` publica en loopback.
- Datos productivos viven en `pos_postgres_prod_data`.
- Respaldos usan `.dump` PostgreSQL custom.
- Restauracion exige confirmacion explicita.
- Actualizacion exige respaldo previo.

## Resumen final de scripts

Esta es la referencia rapida para saber que script usar y cuando. La idea principal es:

```text
install.ps1 = preparar NovaPOS por primera vez
start.ps1   = encender NovaPOS cuando ya existe
stop.ps1    = detener NovaPOS sin borrar datos
backup.ps1  = crear respaldo
restore.ps1 = cargar o recuperar respaldo
```

La usuaria de la tienda no deberia usar estos scripts todos los dias. Los scripts son para instalacion, mantenimiento, soporte y respaldos.

| Script | Para que sirve | Cuando se usa |
| --- | --- | --- |
| `common.ps1` | Contiene funciones compartidas: rutas del proyecto, argumentos comunes de Docker Compose, validacion de Docker, lectura segura de `.env`, calculo de URL y funciones auxiliares. | No se ejecuta directamente. Lo usan los demas scripts. |
| `install.ps1` | Prepara NovaPOS por primera vez: valida Docker y `.env`, valida Compose, construye imagenes, inicia `db`, `backend` y `frontend`, espera servicios y muestra la URL. | Primera instalacion en una computadora. Normalmente se usa una sola vez. |
| `start.ps1` | Enciende una instalacion existente sin reconstruir imagenes ni borrar datos. | Cuando NovaPOS ya fue instalado y los contenedores estan detenidos. |
| `stop.ps1` | Detiene `frontend`, `backend` y `db` sin borrar contenedores ni volumenes. | Cuando se quiere apagar NovaPOS de forma ordenada sin perder datos. |
| `status.ps1` | Muestra si `db`, `backend` y `frontend` existen, estan corriendo y estan saludables. Tambien muestra la URL, el volumen y el ultimo respaldo. | Para diagnosticar rapidamente si NovaPOS esta bien. |
| `logs.ps1` | Muestra logs de todos los servicios o de uno especifico. Acepta `-Service db`, `-Service backend`, `-Service frontend` y `-Follow`. | Cuando algo falla o se necesita ver mensajes internos. |
| `backup.ps1` | Crea un respaldo `.dump` de PostgreSQL con `pg_dump -Fc`, lo valida con `pg_restore -l`, lo copia al host y opcionalmente lo copia a Google Drive, OneDrive, USB o carpeta externa con `-CloudBackupDirectory`. | Para hacer respaldos manuales o como comando ejecutado por la tarea diaria. |
| `restore.ps1` | Restaura un archivo `.dump` sobre la base de produccion. Antes crea un respaldo de seguridad, detiene backend/frontend, pide escribir `RESTORE` y verifica servicios al final. | Cuando se necesita cargar una base inicial o recuperar datos desde un respaldo. |
| `update.ps1` | Crea respaldo obligatorio, valida Compose, reconstruye imagenes, reinicia servicios y permite que Flyway aplique migraciones. Con `-Pull`, ejecuta solo `git pull --ff-only` si el repo esta limpio. | Cuando hay una nueva version de NovaPOS. |
| `create-shortcut.ps1` | Crea un acceso directo `NovaPOS.url` en el escritorio con la URL real. Opcionalmente crea un acceso directo para ejecutar `start.ps1`. | Despues de instalar, para que la usuaria abra NovaPOS sin comandos. |
| `register-backup-task.ps1` | Registra en el Programador de tareas de Windows la ejecucion automatica diaria de `backup.ps1`. Por defecto usa `12:30` hora local de Windows. Puede guardar local y copiar a nube con `-CloudBackupDirectory`. | Una sola vez durante la configuracion de respaldos automaticos. |

### Primera vez en una computadora

Usa este flujo cuando es una computadora nueva o cuando nunca se ha instalado NovaPOS de produccion en esa maquina.

```powershell
.\scripts\install.ps1
```

Este comando prepara todo: Docker, imagenes, contenedores, volumen de PostgreSQL, backend, frontend y URL local.

Si la base debe empezar vacia, no ejecutes `restore.ps1`. Entra a `http://localhost` y configura los datos iniciales desde la aplicacion.

### Primera vez si ya tienes un `.dump`

Si ya tienes un archivo `.dump` con la base de datos que quieres usar, primero instala y luego restaura:

```powershell
.\scripts\install.ps1
.\scripts\restore.ps1 -BackupFile "ruta\al\respaldo.dump"
```

`restore.ps1` reemplaza la base actual con el contenido del `.dump`. Por eso pide escribir exactamente:

```text
RESTORE
```

Usa el `.dump`, no el `.sha256`. El `.sha256` solo sirve para verificar que el dump no se dano.

### Despues de instalar

Estos pasos se hacen una vez para dejar el uso diario comodo:

```powershell
.\scripts\create-shortcut.ps1
.\scripts\register-backup-task.ps1 `
  -BackupDirectory "C:\NovaPOS-Backups" `
  -CloudBackupDirectory "G:\Mi unidad\NovaPOS-Backups"
```

`create-shortcut.ps1` crea el acceso directo de NovaPOS.

`register-backup-task.ps1` programa el respaldo diario automatico. No hace falta ejecutarlo todos los dias; Windows lo hara a las `12:30` si la computadora esta encendida, Docker Desktop funciona y Google Drive esta disponible.

### Uso diario normal de la tienda

```text
1. Encender la computadora.
2. Esperar a que Docker Desktop inicie.
3. Abrir el acceso directo de NovaPOS.
4. Iniciar sesion.
5. Trabajar normalmente.
```

La usuaria no necesita ejecutar `install.ps1`, `start.ps1`, `backup.ps1` ni comandos diarios si Docker Desktop y la tarea programada estan funcionando.

### Cuando usar `start.ps1`

Usa `start.ps1` cuando NovaPOS ya estaba instalado, pero los contenedores estan apagados.

Ejemplos:

```text
Se reinicio Windows y NovaPOS no abrio.
Alguien ejecuto stop.ps1.
Docker Desktop arranco, pero la aplicacion quedo detenida.
```

Comando:

```powershell
.\scripts\start.ps1
```

No uses `start.ps1` como sustituto de la primera instalacion. Para primera vez, usa `install.ps1`.

### Cuando usar `stop.ps1`

Usa `stop.ps1` para detener NovaPOS sin borrar datos:

```powershell
.\scripts\stop.ps1
```

Esto detiene contenedores, pero conserva el volumen `pos_postgres_prod_data`.

### Respaldos automaticos

Para dejar respaldos automaticos, registra la tarea una vez:

```powershell
.\scripts\register-backup-task.ps1 `
  -BackupDirectory "C:\NovaPOS-Backups" `
  -CloudBackupDirectory "G:\Mi unidad\NovaPOS-Backups"
```

Despues de eso, la tarea `NovaPOS Daily Backup` ejecuta `backup.ps1` todos los dias a las `12:30` hora local de Windows.

El respaldo queda en dos lugares:

```text
C:\NovaPOS-Backups
G:\Mi unidad\NovaPOS-Backups
```

Google Drive para escritorio sube automaticamente la segunda copia a la cuenta de Google.

### Respaldo manual

Usa `backup.ps1` manualmente cuando quieras crear un respaldo en ese momento, por ejemplo antes de una actualizacion o antes de hacer pruebas:

```powershell
.\scripts\backup.ps1 `
  -BackupDirectory "C:\NovaPOS-Backups" `
  -CloudBackupDirectory "G:\Mi unidad\NovaPOS-Backups"
```

### Restaurar una base

Usa `restore.ps1` solo cuando quieras cargar una base inicial o recuperar datos desde un respaldo:

```powershell
.\scripts\restore.ps1 -BackupFile "G:\Mi unidad\NovaPOS-Backups\novapos-fecha.dump"
```

Este script reemplaza la base actual. Antes de hacerlo crea un respaldo de seguridad y pide confirmacion escribiendo `RESTORE`.

### Actualizar NovaPOS

Usa `update.ps1` cuando ya tienes una version nueva del codigo en la computadora:

```powershell
.\scripts\update.ps1
```

Si quieres que tambien haga `git pull --ff-only` antes de actualizar:

```powershell
.\scripts\update.ps1 -Pull
```

`update.ps1` siempre intenta crear un respaldo antes de reconstruir e iniciar servicios.

### Cuando algo falla

Primero revisa estado:

```powershell
.\scripts\status.ps1
```

Luego mira logs. Para backend:

```powershell
.\scripts\logs.ps1 -Service backend
```

Para base de datos:

```powershell
.\scripts\logs.ps1 -Service db
```

Para frontend/Nginx:

```powershell
.\scripts\logs.ps1 -Service frontend
```

Si quieres ver logs en vivo:

```powershell
.\scripts\logs.ps1 -Service backend -Follow
```

### Mantenimiento ocasional

```powershell
.\scripts\status.ps1
.\scripts\logs.ps1 -Service backend
.\scripts\backup.ps1 `
  -BackupDirectory "C:\NovaPOS-Backups" `
  -CloudBackupDirectory "G:\Mi unidad\NovaPOS-Backups"
.\scripts\update.ps1
```

### Que nunca se debe usar para esta instalacion

No uses:

```text
docker compose down -v
```

No borres el volumen:

```text
pos_postgres_prod_data
```

No restaures un `.dump` si no estas segura de que quieres reemplazar la base actual.

### Regla mental sencilla

```text
Primera vez:
  install.ps1

Ya instalado y quiero encender:
  start.ps1

Quiero apagar sin borrar:
  stop.ps1

Quiero revisar:
  status.ps1

Quiero ver errores:
  logs.ps1

Quiero respaldar ahora:
  backup.ps1

Quiero programar respaldos diarios:
  register-backup-task.ps1 una sola vez

Quiero cargar una base desde un .dump:
  restore.ps1

Quiero actualizar:
  update.ps1
```
