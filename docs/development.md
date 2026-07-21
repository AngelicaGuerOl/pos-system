# Local Development

This guide explains how to run NovaPOS for development. For a Windows store installation using production containers, use [Local production deployment](store-deployment.md).

## Requirements

- Git.
- Java 17.
- Maven Wrapper included in `pos-backend`.
- Node.js compatible with the project's Vite/React toolchain.
- npm compatible with `package-lock.json`.
- Docker and Docker Compose for PostgreSQL and full container execution.

## Initial Configuration

```bash
git clone https://github.com/AngelicaGuerOl/pos-system.git
cd pos-system
cp .env.example .env
```

PowerShell:

```powershell
git clone https://github.com/AngelicaGuerOl/pos-system.git
cd pos-system
Copy-Item .env.example .env
```

Edit `.env` and replace database credentials, `JWT_SECRET`, JWT expiration, and bootstrap admin values. Do not commit `.env`.

How `.env` is used:

- Docker Compose reads the root `.env` automatically and injects the variables defined in `docker-compose.yml` and `docker-compose.prod.yml`.
- When Spring Boot runs directly from `pos-backend`, `application.yml` imports `optional:file:.env[.properties]` and `optional:file:../.env[.properties]`. Running Maven from `pos-backend` can therefore read the root `.env` through `../.env`. The `dev` profile also defines default datasource values in `application-dev.yml`.
- When Vite runs directly from `pos-frontend`, it does not load the root `.env`. The current frontend works without that root file because `env.apiBaseUrl` defaults to `/api`, and `vite.config.ts` proxies `/api` to `http://localhost:8080` by default.
- If the frontend must call a different API URL in direct Vite mode, set `VITE_API_BASE_URL` in the shell before `npm run dev` or create a local Vite env file inside `pos-frontend`, such as `.env.local`. Do not commit local env files with real secrets or machine-specific URLs.

Main variables:

| Variable | Use |
| --- | --- |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT` | PostgreSQL in Docker. |
| `BACKEND_PORT` | Backend host port in development. |
| `FRONTEND_PORT` | Vite frontend host port. |
| `VITE_API_BASE_URL` | Base URL used by Axios in development. |
| `SPRING_PROFILES_ACTIVE` | Spring profile when running in Docker. |
| `JWT_SECRET`, `JWT_EXPIRATION_MINUTES` | JWT configuration. |
| `BOOTSTRAP_ADMIN_*` | Initial administrator user when enabled. |
| `OPEN_FOOD_FACTS_BASE_URL`, `OPEN_FOOD_FACTS_USER_AGENT` | Optional external barcode lookup configuration. |
| `PGADMIN_*` | pgAdmin in the development stack. |

Open Food Facts lookup defaults to `https://world.openfoodfacts.org` when no custom base URL is provided. For real use, set a clear `OPEN_FOOD_FACTS_USER_AGENT` value in local configuration so external requests identify the application/contact context. The lookup is optional for product capture; if Internet access is unavailable, products can still be entered manually.

## Option A: PostgreSQL In Docker, Backend And Frontend Local

This is the most convenient option for development.

Start PostgreSQL:

```bash
docker compose up -d db
```

Run the backend with the `dev` profile:

```bash
cd pos-backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

PowerShell:

```powershell
cd pos-backend
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

Run the frontend:

```bash
cd pos-frontend
npm ci
npm run dev
```

With the current Vite defaults, the browser calls `/api` on the Vite dev server and Vite proxies those requests to `http://localhost:8080`. To override the API base URL for the shell session:

```bash
cd pos-frontend
VITE_API_BASE_URL=http://localhost:8080/api npm run dev
```

PowerShell:

```powershell
cd pos-frontend
$env:VITE_API_BASE_URL = "http://localhost:8080/api"
npm run dev
```

Default URLs with `.env.example`:

| Service | URL |
| --- | --- |
| Vite frontend | `http://localhost:5173` |
| API | `http://localhost:8080/api` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| PostgreSQL | `localhost:5433` |

Avoid running two backends on `8080` at the same time.

## Option B: Complete Development Stack With Docker

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

PowerShell:

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Services:

| Service | Container | Host port from `.env.example` |
| --- | --- | --- |
| `db` | PostgreSQL 16 | `5433` |
| `backend` | Spring Boot | `8080` |
| `frontend` | Vite dev server | `5173` |
| `pgadmin` | pgAdmin 4 | `5051` |

Useful commands:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

`docker-compose.dev.yml` mounts `pos-frontend` and a `frontend_node_modules` volume for the Vite development loop.

## Migrations

Flyway runs when the backend starts. Migrations live in:

```text
pos-backend/src/main/resources/db/migration
```

Rules:

- Do not modify already-applied migrations.
- Create a new `V{number}__description.sql` migration for schema changes.
- Keep JPA entities, validations, and constraints consistent.
- `spring.jpa.hibernate.ddl-auto=validate` validates the schema; it does not create or update tables.

## Stopping Services

To stop the Docker development stack without deleting data:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Do not use `down -v` unless you intentionally want to delete the volume and lose development data. Create a backup before any destructive cleanup.

## Tests And Builds

Backend:

```bash
cd pos-backend
./mvnw clean verify
```

Frontend:

```bash
cd pos-frontend
npm run lint
npm run build
```

No frontend `test` script is configured in the current version.

## Common Problems

| Problem | Check |
| --- | --- |
| Port already in use | Check processes using `8080`, `5173`, `5433`, or `5051`. |
| Backend cannot connect to DB | Confirm `db` health and verify `SPRING_DATASOURCE_URL` points to `localhost:5433` outside Docker or `db:5432` inside Docker. |
| Missing variables | Compare `.env` with `.env.example`. |
| Invalid JWT | Use a Base64/Base64URL secret that decodes to at least 32 bytes. |
| Swagger does not open | Confirm the backend runs with the `dev` profile. |
| Frontend cannot reach API | Check `VITE_API_BASE_URL`, the Vite proxy, and CORS. |
| Flyway error | Check migration order and confirm no applied migration was modified. |

## Files That Should Not Be Versioned

`.env`, `.dump` backups, backup folders, `node_modules`, `dist`, `target`, real merchandise spreadsheets, and real historical import reports are ignored by `.gitignore`.
