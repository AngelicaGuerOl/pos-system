# Backup and Restore

Backups are essential because NovaPOS stores operational data for sales, stock, cash sessions, customer credit accounts, payments, supplier entries, and supplier settlements.

This document provides command patterns for the current Docker database service. It does not create automated backup scripts.

The commands assume the Docker Compose service name is `db`, which is the PostgreSQL service defined by the project. They use the database user and database name already available inside the container.

## Backup Procedure

Create a local backup directory:

```bash
mkdir -p backups
```

Create a compressed PostgreSQL backup from the `db` service:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > backups/novapos-$(date +%F).dump
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force backups | Out-Null

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db `
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/novapos.dump'

docker compose -f docker-compose.yml -f docker-compose.dev.yml cp `
  db:/tmp/novapos.dump backups/novapos-local.dump

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db `
  rm -f /tmp/novapos.dump
```

The command uses database credentials already configured inside the PostgreSQL container. Do not place real passwords in command history or documentation.

Keep backup files outside public repository history. If a backup must be moved between machines, transfer it through a secure channel and restrict access to people who are allowed to view store data.

Use a filename that includes the date and, when useful, a short environment label such as `local` or `store-pc`. Avoid putting customer, supplier, or sales details in the filename.

## Restore Procedure

Restoration can overwrite data. Stop application writes before restoring and make a safety backup of the current database first.

1. Stop the backend and frontend or ensure no users are writing data.
2. Create a safety backup.
3. Confirm the target database.
4. Restore the dump.
5. Restart services.
6. Verify business data.

Example restore command:

```bash
cat backups/novapos-YYYY-MM-DD.dump | docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists'
```

PowerShell:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml cp `
  backups/novapos-local.dump db:/tmp/novapos.dump

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db `
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /tmp/novapos.dump'

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db `
  rm -f /tmp/novapos.dump
```

Warning: `--clean --if-exists` drops existing database objects before restoring them. Use only with the correct target database and a confirmed backup.

If Flyway migrations have changed since the backup was created, restore into a test database first and start the backend to let validation confirm whether the schema is compatible.

Do not restore a dump into a database that is actively being used by cashiers. A restore should be treated as a maintenance operation because it can replace current sales, cash session, inventory, receivable, and supplier settlement data.

## Verification Checklist

After restoring, verify:

- Users can log in.
- Products and categories are present.
- Current stock values are correct.
- Recent sales and sale details are present.
- Cash sessions and cash movements are present.
- Receivable balances and payments are present.
- Supplier entries are present.
- Supplier settlements and settlement details are present.
- Excel export still works for finalized supplier settlements.

Also verify that the backend starts successfully after restoration. With `ddl-auto=validate`, startup is a useful schema compatibility check because Hibernate validates the database structure against the mapped entities.

## Recommended Policy

Recommended local operating policy:

- Create a database backup at least daily.
- Back up before application updates or schema migrations.
- Keep multiple retained copies.
- Store at least one copy outside the store computer.
- Test restoration periodically on a non-production copy.

This is a recommendation. Automated backups are not currently implemented in the repository.

For a small local installation, the most important habit is consistency: create backups before risky operations and verify periodically that at least one recent backup can actually be restored.

Backups should be considered part of store operations, not only a technical task. A recent backup is especially important before importing historical data, applying new Flyway migrations, changing Docker volumes, or replacing the machine that hosts the database.

---

[Back to Technical Documentation](README.md)
