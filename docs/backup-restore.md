# Respaldos y restauración

NovaPOS guarda información operativa en PostgreSQL: ventas, stock, caja, clientes, cuentas por cobrar, proveedores, cortes y usuarios. Los respaldos son obligatorios antes de restaurar, actualizar o mover la instalación a otra computadora.

## Formato de respaldo

Los scripts de producción local crean archivos `.dump` en formato custom de PostgreSQL:

```text
pg_dump -Fc
```

La restauración usa:

```text
pg_restore
```

Este formato permite validar el archivo con `pg_restore -l` antes de restaurar.

## Producción local en Windows

Los scripts reales están en `scripts/` y usan:

```powershell
docker compose --env-file .env `
  -f docker-compose.yml `
  -f docker-compose.prod.yml
```

Crear respaldo:

```powershell
.\scripts\backup.ps1
```

Ubicación por defecto:

```text
C:\NovaPOS-Backups
```

Nombre de archivo:

```text
novapos-yyyy-MM-dd_HH-mm-ss.dump
```

Crear respaldo en otra carpeta:

```powershell
.\scripts\backup.ps1 -BackupDirectory "D:\Respaldos\NovaPOS"
```

Crear respaldo local y copia externa/nube:

```powershell
.\scripts\backup.ps1 `
  -BackupDirectory "C:\NovaPOS-Backups" `
  -CloudBackupDirectory "G:\Mi unidad\NovaPOS-Backups"
```

`G:\Mi unidad\NovaPOS-Backups` es solo un ejemplo. La letra de unidad o la ubicación puede cambiar según la computadora y el servicio de sincronización configurado.

El script:

- valida que Docker esté disponible;
- valida variables requeridas;
- exige que el servicio `db` esté en ejecución;
- ejecuta `pg_dump -Fc` dentro del contenedor;
- valida el dump con `pg_restore -l`;
- copia el archivo al equipo Windows;
- comprueba que el archivo exista y no esté vacío;
- elimina el archivo temporal del contenedor.

## Registrar respaldo diario

```powershell
.\scripts\register-backup-task.ps1
```

Hora personalizada:

```powershell
.\scripts\register-backup-task.ps1 -Time "20:30"
```

Con copia externa:

```powershell
.\scripts\register-backup-task.ps1 `
  -Time "12:30" `
  -BackupDirectory "C:\NovaPOS-Backups" `
  -CloudBackupDirectory "G:\Mi unidad\NovaPOS-Backups"
```

La computadora debe estar encendida, Docker Desktop debe estar funcionando y Windows debe permitir ejecutar la tarea.

## Restauración en producción local

La restauración reemplaza datos. Ejecútala solo si confirmas que el archivo corresponde a la instalación correcta.

No se requiere restaurar un `.dump` para una instalación completamente nueva. Usa `restore.ps1` cuando necesites recuperar datos, mover NovaPOS a otra computadora o migrar una instalación existente desde un respaldo.

```powershell
.\scripts\restore.ps1 -BackupFile "C:\NovaPOS-Backups\novapos-fecha.dump"
```

El script:

- valida Docker y `.env`;
- comprueba que el archivo exista y no esté vacío;
- pide escribir exactamente `RESTORE`;
- crea un respaldo preventivo antes de restaurar;
- detiene `frontend` y `backend` para evitar escrituras;
- mantiene `db` activo o lo inicia si hace falta;
- copia el dump al contenedor;
- valida con `pg_restore -l`;
- cierra conexiones activas a la base objetivo;
- ejecuta `pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction`;
- reinicia backend y frontend;
- verifica que el frontend responda.

No ejecutes restauraciones con usuarios operando el sistema.

## Verificación posterior

Después de restaurar, revisar manualmente:

- inicio de sesión;
- usuarios;
- categorías y productos;
- existencias;
- clientes;
- ventas recientes;
- caja;
- cuentas por cobrar y abonos;
- proveedores;
- entradas de mercancía;
- cortes de proveedor;
- exportación Excel de cortes finalizados.

El arranque del backend también valida el esquema por Flyway y `ddl-auto=validate`.

## Recuperación en otra computadora

1. En la computadora actual, ejecutar:

```powershell
.\scripts\backup.ps1
```

2. Copiar el proyecto a la nueva computadora.
3. Instalar Docker Desktop.
4. Crear `.env` desde `.env.example` y configurar secretos reales.
5. Ejecutar:

```powershell
.\scripts\install.ps1
```

6. Copiar el `.dump` a `C:\NovaPOS-Backups`.
7. Restaurar:

```powershell
.\scripts\restore.ps1 -BackupFile "C:\NovaPOS-Backups\novapos-fecha.dump"
```

8. Verificar usuarios, productos, existencias, ventas, proveedores, cuentas por cobrar y una venta de prueba.

## Desarrollo

Para respaldar la base del stack de desarrollo:

```bash
mkdir -p backups
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > backups/novapos-$(date +%F).dump
```

Restaurar en desarrollo:

```bash
cat backups/novapos-YYYY-MM-DD.dump | docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists'
```

Advertencia: `--clean --if-exists` elimina objetos existentes antes de restaurarlos.

## Reglas de seguridad

- No guardar `.dump` en Git.
- No subir respaldos con datos reales a repositorios públicos.
- Conservar copias fuera de la computadora principal.
- Probar restauración periódicamente en un entorno no productivo.
- Crear respaldo antes de actualizar o importar datos históricos.
- No usar `docker compose down -v` para resolver errores.
- No eliminar el volumen `pos_postgres_prod_data` sin respaldo confirmado.
