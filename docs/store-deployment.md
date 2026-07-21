# Instalación local de tienda

Esta guía explica cómo dejar NovaPOS funcionando en una computadora Windows de una tienda familiar. La aplicación queda disponible en `http://localhost`, usa PostgreSQL dentro de Docker y no se publica en Internet.

## Uso diario

La usuaria normal solo necesita:

```text
Encender la computadora
-> esperar a que Docker Desktop inicie
-> abrir el acceso directo de NovaPOS
-> iniciar sesión
```

No necesita IntelliJ, VS Code, Maven, Node.js, pgAdmin, Git ni ejecutar comandos diariamente.

## Qué instala el técnico

La instalación local de producción usa:

- `db`: PostgreSQL 16 en Docker.
- `backend`: Spring Boot con perfil `prod`.
- `frontend`: React compilado y servido por Nginx.
- Un volumen Docker exclusivo llamado `pos_postgres_prod_data`.
- Scripts PowerShell para instalar, iniciar, detener, revisar estado, ver logs, respaldar, restaurar, actualizar y registrar respaldos diarios.

Solo el frontend publica un puerto en la computadora, por defecto `127.0.0.1:80`. Backend y PostgreSQL quedan dentro de la red interna de Docker.

## Requisitos de Windows

- Windows 10/11 de 64 bits.
- Docker Desktop instalado.
- Virtualización habilitada en BIOS/UEFI si Docker Desktop la solicita.
- PowerShell 5.1 o PowerShell 7.
- Espacio suficiente para imágenes Docker y respaldos.

WSL solo es necesario si Docker Desktop lo pide durante la instalación. Sigue las instrucciones oficiales de Docker Desktop y reinicia Windows si lo solicita.

## Preparar Docker Desktop

1. Instala Docker Desktop.
2. Abre Docker Desktop una vez y espera a que diga que Docker está funcionando.
3. Activa la opción para iniciar Docker Desktop con Windows.
4. Reinicia la computadora y confirma que Docker Desktop abre solo.

Si Docker Desktop no inicia, abre Docker Desktop manualmente, revisa que la virtualización esté habilitada y espera a que termine de arrancar antes de abrir NovaPOS.

## Copiar el proyecto

El técnico puede copiar la carpeta del proyecto o clonarla con Git. Git no es necesario para la usuaria final.

Dentro de la carpeta del proyecto debe existir `.env`. Si no existe, copia `.env.example` como `.env` y edita valores reales sin compartir contraseñas.

No subas `.env` ni archivos `.dump` a GitHub.

## Preparar `.env`

Revisa que `.env` tenga las variables requeridas para la instalación de tienda.

### Variables obligatorias de producción local

- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `SPRING_PROFILES_ACTIVE`
- `JWT_SECRET`
- `JWT_EXPIRATION_MINUTES`
- `BOOTSTRAP_ADMIN_ENABLED`
- `BOOTSTRAP_ADMIN_USERNAME`
- `BOOTSTRAP_ADMIN_PASSWORD`

### Variables opcionales de publicación local

`docker-compose.prod.yml` define valores por defecto para publicar NovaPOS solo en la computadora local. Puedes agregar estas variables si quieres dejarlas explícitas:

```env
NOVAPOS_BIND_ADDRESS=127.0.0.1
NOVAPOS_FRONTEND_PORT=80
```

### Variables opcionales para consulta externa de productos

NovaPOS puede consultar Open Food Facts cuando se captura un código de barras que no existe en el catálogo local. Esta consulta es opcional y requiere Internet solo para ese apoyo de captura; las operaciones principales de tienda siguen funcionando localmente mientras Docker Desktop y los contenedores estén activos.

`docker-compose.yml` define valores por defecto, pero para uso real conviene dejar explícito un `User-Agent` que identifique la instalación o contacto del proyecto:

```env
OPEN_FOOD_FACTS_BASE_URL=https://world.openfoodfacts.org
OPEN_FOOD_FACTS_USER_AGENT=NovaPOS/1.0 (contacto@example.com)
```

### Variables utilizadas solo en desarrollo

Estas variables están en `.env.example` para el stack de desarrollo. En producción local, `docker-compose.prod.yml` no publica PostgreSQL ni backend al host, y pgAdmin queda bajo el perfil `dev-tools`.

- `DB_PORT`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `VITE_API_BASE_URL`
- `PGADMIN_EMAIL`
- `PGADMIN_PASSWORD`
- `PGADMIN_PORT`

Los scripts actuales ejecutan `Assert-RequiredEnv` desde `scripts/common.ps1`, por lo que validan que estas variables también existan en `.env` aunque no sean usadas por el stack diario de tienda. Por eso se recomienda partir de `.env.example` y conservar todas sus claves.

No cambies contraseñas ni JWT desde los scripts. Si falta una variable, el script mostrará solo el nombre faltante.

## Instalación nueva

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\install.ps1
```

El instalador valida Docker, valida la configuración, construye imágenes e inicia `db`, `backend` y `frontend`. No restaura respaldos automáticamente y no borra bases existentes.

En una instalación completamente nueva no se necesita un archivo `.dump`. Flyway crea o valida el esquema al iniciar el backend. El administrador inicial se crea únicamente si `BOOTSTRAP_ADMIN_ENABLED=true` y las variables `BOOTSTRAP_ADMIN_USERNAME` y `BOOTSTRAP_ADMIN_PASSWORD` están configuradas.

Después del primer inicio, configura catálogos, usuarios, productos, proveedores e inventario desde la aplicación.

## Migrar una instalación existente desde un respaldo

**Omite esta sección si estás creando una instalación completamente nueva.**

Para migrar datos de una instalación existente:

1. Instala primero NovaPOS con `.\scripts\install.ps1`.
2. Copia el archivo `.dump` a una carpeta fuera del repositorio.
3. Restaura el respaldo con `restore.ps1`.
4. Verifica usuarios, productos, existencias, ventas, proveedores y cuentas por cobrar.
5. Usa los usuarios restaurados para iniciar sesión.

Copia el archivo `.dump` a una carpeta fuera del repositorio, por ejemplo `C:\NovaPOS-Backups`.

Ejecuta:

```powershell
.\scripts\restore.ps1 `
  -BackupFile "C:\NovaPOS-Backups\novapos-fecha.dump"
```

El script mostrará el archivo, advertirá que reemplaza la información actual y pedirá escribir exactamente:

```text
RESTORE
```

Antes de restaurar crea un respaldo de seguridad de la base actual. Si ese respaldo falla, la restauración se cancela.

Después de restaurar revisa:

- Productos.
- Existencias.
- Usuarios.
- Proveedores.
- Una apertura de caja.
- Una venta de prueba.

## Primer inicio

1. Abre `http://localhost` o el acceso directo `NovaPOS`.
2. Inicia sesión con el usuario administrador configurado.
3. Cambia la contraseña temporal si la aplicación lo solicita.
4. Verifica que exista el usuario administrador.
5. Crea un usuario con rol `CASHIER` para operación diaria.

## Scripts disponibles

Ejecuta los scripts desde PowerShell en la carpeta del proyecto:

```powershell
.\scripts\start.ps1
.\scripts\stop.ps1
.\scripts\status.ps1
.\scripts\logs.ps1
.\scripts\backup.ps1
.\scripts\restore.ps1 -BackupFile "C:\NovaPOS-Backups\novapos-fecha.dump"
.\scripts\update.ps1
```

- `start.ps1`: inicia la instalación existente sin reconstruir imágenes.
- `stop.ps1`: detiene contenedores sin borrar volúmenes.
- `status.ps1`: muestra estado de servicios, URL, volumen y último respaldo.
- `logs.ps1`: muestra logs. Puede usarse con `-Service db`, `-Service backend` o `-Service frontend`.
- `backup.ps1`: crea un `.dump` PostgreSQL en formato custom.
- `restore.ps1`: restaura un `.dump` con confirmación explícita.
- `update.ps1`: crea respaldo, reconstruye imágenes y reinicia servicios.
- `update.ps1 -Pull`: valida Git, exige repositorio limpio y ejecuta solo `git pull --ff-only` antes de reconstruir.

## Acceso directo

Para crear el acceso directo:

```powershell
.\scripts\create-shortcut.ps1
```

Opcionalmente crea otro acceso directo para iniciar NovaPOS:

```powershell
.\scripts\create-shortcut.ps1 -IncludeStartShortcut
```

## Respaldo diario

Los respaldos se guardan por defecto en:

```text
C:\NovaPOS-Backups
```

Para registrar una tarea diaria a las 12:30, usando la zona horaria local configurada en Windows:

```powershell
.\scripts\register-backup-task.ps1
```

Para otra hora:

```powershell
.\scripts\register-backup-task.ps1 -Time "20:30"
```

Para guardar una copia diaria local y otra en una carpeta externa o sincronizada:

```powershell
.\scripts\register-backup-task.ps1 `
  -Time "12:30" `
  -BackupDirectory "C:\NovaPOS-Backups" `
  -CloudBackupDirectory "G:\Mi unidad\NovaPOS-Backups"
```

`G:\Mi unidad\NovaPOS-Backups` es solo un ejemplo. La letra de unidad y la ubicación pueden cambiar según la computadora y la configuración de sincronización.

La computadora debe estar encendida, Docker Desktop debe estar funcionando y Windows debe permitir ejecutar la tarea. Para consultar o eliminar la tarea:

```powershell
schtasks /Query /TN "NovaPOS Daily Backup"
schtasks /Delete /TN "NovaPOS Daily Backup" /F
```

## Recuperación ante fallos

Si `http://localhost` no abre:

1. Abre Docker Desktop y espera a que esté listo.
2. Ejecuta `.\scripts\status.ps1`.
3. Si algún servicio está detenido, ejecuta `.\scripts\start.ps1`.
4. Revisa logs con `.\scripts\logs.ps1 -Service backend` o `.\scripts\logs.ps1 -Service frontend`.

Si el backend no está saludable:

1. Verifica que `db` esté saludable.
2. Revisa `.\scripts\logs.ps1 -Service backend`.
3. Confirma que `.env` tenga las variables requeridas.
4. Si hubo una actualización con migraciones Flyway, revisa los errores antes de tocar la base.

Después de una actualización revisa inicio de sesión, productos, existencias, ventas, caja, cuentas por cobrar y cortes de proveedor.

## Cambiar a otra computadora

1. En la computadora actual ejecuta `.\scripts\backup.ps1`.
2. Copia el proyecto a la nueva computadora.
3. Instala Docker Desktop.
4. Prepara `.env` sin exponer secretos.
5. Ejecuta `.\scripts\install.ps1`.
6. Copia el `.dump` a `C:\NovaPOS-Backups`.
7. Ejecuta `.\scripts\restore.ps1 -BackupFile "C:\NovaPOS-Backups\novapos-fecha.dump"`.
8. Verifica datos y una venta de prueba.

## Advertencias importantes

Nunca ejecutes:

```text
docker compose down -v
```

Nunca elimines el volumen de producción `pos_postgres_prod_data`.

El volumen Docker mantiene los datos mientras la computadora funciona, pero no sustituye un respaldo externo. Guarda los `.dump` fuera del repositorio y, si es posible, conserva copias en otro disco o medio seguro.

---

[Volver a la documentación técnica](README.md)
