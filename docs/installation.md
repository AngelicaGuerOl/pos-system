# Installation

This guide describes the verified ways to run NovaPOS locally for development. For the Windows local store production installation, use [Local Store Deployment](store-deployment.md).

## Prerequisites

### Development

- Git.
- Java 17.
- Maven Wrapper included in `pos-backend`.
- Node.js compatible with the frontend toolchain.
- npm with `package-lock.json` support.
- Docker and Docker Compose for PostgreSQL and optional full-stack execution.

### Full Docker Execution

For the Docker-based development stack, the host needs Docker and Docker Compose. The containers provide:

- PostgreSQL 16.
- Eclipse Temurin 17 for the backend image.
- Node 22 Alpine for the frontend image.
- pgAdmin 4.

## Clone and Configuration

```bash
git clone https://github.com/AngelicaGuerOl/pos-system.git
cd pos-system
cp .env.example .env
```

Windows PowerShell:

```powershell
git clone https://github.com/AngelicaGuerOl/pos-system.git
cd pos-system
Copy-Item .env.example .env
```

Developers who already have GitHub SSH keys configured can also use the SSH clone URL.

Edit `.env` before running the application. Replace database credentials, JWT secret, JWT expiration, and bootstrap admin values. Do not commit real secrets.

The backend imports `.env` from the backend directory or the repository root through Spring configuration. Docker Compose also reads `.env` at the repository root for service configuration.

The default `.env.example` exposes the application through:

| Service | Host URL / port |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API base URL | `http://localhost:8080/api` |
| PostgreSQL | `localhost:5433` |
| pgAdmin | `http://localhost:5051` |

## Development Mode

Start PostgreSQL:

```bash
docker compose up -d db
```

Run the backend with the `dev` profile:

```bash
cd pos-backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend can also be started from IntelliJ IDEA using the `dev` profile.

Run the frontend:

```bash
cd pos-frontend
npm ci
npm run dev
```

Avoid running the backend container and a local Maven/IntelliJ backend at the same time on port `8080`.

In this mode, the database runs in Docker while the backend and frontend run directly on the host. This is the most convenient setup for debugging Java code, inspecting SQL logs in the `dev` profile, and using Vite hot reload.

## Complete Docker Development Stack

Start the verified Docker Compose development stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Services:

| Service | Container role |
| --- | --- |
| `db` | PostgreSQL database |
| `backend` | Spring Boot REST API |
| `frontend` | Vite development frontend |
| `pgadmin` | Database administration UI |

Check status:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

Follow backend logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend
```

Stop the stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

The current frontend container runs the Vite development server. It is not a production-optimized static container.

For daily store use on Windows, do not use the development stack. Use the production guide: [Local Store Deployment](store-deployment.md).

The `docker-compose.dev.yml` file adds frontend volume mounts and polling-related environment variables for a better local development loop. It does not replace the base services defined in `docker-compose.yml`.

## Data Persistence

PostgreSQL data is stored in the `pos_postgres_data` Docker volume.

`docker compose down` stops and removes containers but keeps the volume.

Warning: the following command removes the database volume and deletes local data for this stack.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

Use a backup before destructive operations.

## Swagger

Swagger UI and OpenAPI endpoints are available only when the backend runs with the `dev` profile:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- OpenAPI YAML: `http://localhost:8080/v3/api-docs.yaml`

If the Docker stack uses `SPRING_PROFILES_ACTIVE=prod`, Swagger is disabled. Change the profile only for local development.

## Common Problems

| Problem | Check |
| --- | --- |
| Port already in use | Stop another backend/frontend/database process using `8080`, `5173`, `5433`, or `5051`. |
| Backend cannot connect to PostgreSQL | Verify database container health, credentials, and `SPRING_DATASOURCE_URL`. |
| Wrong database host in Docker | Inside Docker, the database host is `db`, not `localhost`. |
| Missing environment variables | Compare `.env` with `.env.example`. |
| Invalid JWT secret | Ensure `JWT_SECRET` is Base64/Base64URL and decodes to at least 32 bytes. |
| Flyway validation failure | Verify migrations were applied in order and no applied migration was edited. |
| Frontend cannot reach backend | Verify `VITE_API_BASE_URL` and CORS allowed origins. |
| Running two backends | Stop either the local Maven/IDE backend or the backend container. |

---

[Back to Technical Documentation](README.md)
