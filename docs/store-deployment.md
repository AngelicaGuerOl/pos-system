# Instalacion local de tienda

Esta guia explica como dejar NovaPOS funcionando en una computadora Windows de una tienda familiar. La aplicacion queda disponible en `http://localhost`, usa PostgreSQL dentro de Docker y no se publica en Internet.

## Uso diario

La usuaria normal solo necesita:

```text
Encender la computadora
-> esperar a que Docker Desktop inicie
-> abrir el acceso directo de NovaPOS
-> iniciar sesion
```

No necesita IntelliJ, VS Code, Maven, Node.js, pgAdmin, Git ni ejecutar comandos diariamente.

## Que instala el tecnico

La instalacion local de produccion usa:

- `db`: PostgreSQL 16 en Docker.
- `backend`: Spring Boot con perfil `prod`.
- `frontend`: React compilado y servido por Nginx.
- Un volumen Docker exclusivo llamado `pos_postgres_prod_data`.
- Scripts PowerShell para instalar, iniciar, detener, revisar estado, ver logs, respaldar, restaurar, actualizar y registrar respaldos diarios.

Solo el frontend publica un puerto en la computadora, por defecto `127.0.0.1:80`. Backend y PostgreSQL quedan dentro de la red interna de Docker.

## Requisitos de Windows

- Windows 10/11 de 64 bits.
- Docker Desktop instalado.
- Virtualizacion habilitada en BIOS/UEFI si Docker Desktop la solicita.
- PowerShell 5.1 o PowerShell 7.
- Espacio suficiente para imagenes Docker y respaldos.

WSL solo es necesario si Docker Desktop lo pide durante la instalacion. Sigue las instrucciones oficiales de Docker Desktop y reinicia Windows si lo solicita.

## Preparar Docker Desktop

1. Instala Docker Desktop.
2. Abre Docker Desktop una vez y espera a que diga que Docker esta funcionando.
3. Activa la opcion para iniciar Docker Desktop con Windows.
4. Reinicia la computadora y confirma que Docker Desktop abre solo.

Si Docker Desktop no inicia, abre Docker Desktop manualmente, revisa que la virtualizacion este habilitada y espera a que termine de arrancar antes de abrir NovaPOS.

## Copiar el proyecto

El tecnico puede copiar la carpeta del proyecto o clonarla con Git. Git no es necesario para la usuaria final.

Dentro de la carpeta del proyecto debe existir `.env`. Si no existe, copia `.env.example` como `.env` y edita valores reales sin compartir contrasenas.

No subas `.env` ni archivos `.dump` a GitHub.

## Preparar `.env`

Revisa que `.env` tenga las variables requeridas:

- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_PORT`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `VITE_API_BASE_URL`
- `PGADMIN_EMAIL`
- `PGADMIN_PASSWORD`
- `PGADMIN_PORT`
- `SPRING_PROFILES_ACTIVE`
- `JWT_SECRET`
- `JWT_EXPIRATION_MINUTES`
- `BOOTSTRAP_ADMIN_ENABLED`
- `BOOTSTRAP_ADMIN_USERNAME`
- `BOOTSTRAP_ADMIN_PASSWORD`

Para la tienda agrega estas variables publicas si quieres dejarlas explicitas:

```env
NOVAPOS_BIND_ADDRESS=127.0.0.1
NOVAPOS_FRONTEND_PORT=80
```

No cambies contrasenas ni JWT desde los scripts. Si falta una variable, el script mostrara solo el nombre faltante.

## Instalar

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\install.ps1
```

El instalador valida Docker, valida la configuracion, construye imagenes e inicia `db`, `backend` y `frontend`. No restaura respaldos automaticamente y no borra bases existentes.

La base de produccion inicia vacia. Los datos iniciales se cargan despues con `restore.ps1`.

## Restaurar respaldo inicial

Copia el archivo `.dump` a una carpeta fuera del repositorio, por ejemplo `C:\NovaPOS-Backups`.

Ejecuta:

```powershell
.\scripts\restore.ps1 `
  -BackupFile "C:\NovaPOS-Backups\novapos-fecha.dump"
```

El script mostrara el archivo, advertira que reemplaza la informacion actual y pedira escribir exactamente:

```text
RESTORE
```

Antes de restaurar crea un respaldo de seguridad de la base actual. Si ese respaldo falla, la restauracion se cancela.

Despues de restaurar revisa:

- Productos.
- Existencias.
- Usuarios.
- Proveedores.
- Una apertura de caja.
- Una venta de prueba.

## Primer inicio

1. Abre `http://localhost` o el acceso directo `NovaPOS`.
2. Inicia sesion con el usuario administrador configurado.
3. Cambia la contrasena temporal si la aplicacion lo solicita.
4. Verifica que exista el usuario administrador.
5. Crea un usuario con rol `CASHIER` para operacion diaria.

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

- `start.ps1`: inicia la instalacion existente sin reconstruir imagenes.
- `stop.ps1`: detiene contenedores sin borrar volumenes.
- `status.ps1`: muestra estado de servicios, URL, volumen y ultimo respaldo.
- `logs.ps1`: muestra logs. Puede usarse con `-Service db`, `-Service backend` o `-Service frontend`.
- `backup.ps1`: crea un `.dump` PostgreSQL en formato custom.
- `restore.ps1`: restaura un `.dump` con confirmacion explicita.
- `update.ps1`: crea respaldo, reconstruye imagenes y reinicia servicios.
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

Para guardar una copia diaria local y otra en Google Drive:

```powershell
.\scripts\register-backup-task.ps1 `
  -Time "12:30" `
  -BackupDirectory "C:\NovaPOS-Backups" `
  -CloudBackupDirectory "G:\Mi unidad\NovaPOS-Backups"
```

La computadora debe estar encendida, Docker Desktop debe estar funcionando y Windows debe permitir ejecutar la tarea. Para consultar o eliminar la tarea:

```powershell
schtasks /Query /TN "NovaPOS Daily Backup"
schtasks /Delete /TN "NovaPOS Daily Backup" /F
```

## Recuperacion ante fallos

Si `http://localhost` no abre:

1. Abre Docker Desktop y espera a que este listo.
2. Ejecuta `.\scripts\status.ps1`.
3. Si algun servicio esta detenido, ejecuta `.\scripts\start.ps1`.
4. Revisa logs con `.\scripts\logs.ps1 -Service backend` o `.\scripts\logs.ps1 -Service frontend`.

Si el backend no esta saludable:

1. Verifica que `db` este saludable.
2. Revisa `.\scripts\logs.ps1 -Service backend`.
3. Confirma que `.env` tenga las variables requeridas.
4. Si hubo una actualizacion con migraciones Flyway, revisa los errores antes de tocar la base.

Despues de una actualizacion revisa inicio de sesion, productos, existencias, ventas, caja, cuentas por cobrar y cortes de proveedor.

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

Nunca elimines el volumen de produccion `pos_postgres_prod_data`.

El volumen Docker mantiene los datos mientras la computadora funciona, pero no sustituye un respaldo externo. Guarda los `.dump` fuera del repositorio y, si es posible, conserva copias en otro disco o medio seguro.

---

[Volver a la documentacion tecnica](README.md)
