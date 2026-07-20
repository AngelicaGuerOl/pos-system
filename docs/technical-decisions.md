# Technical Decisions

This document summarizes relevant NovaPOS decisions in a simplified ADR format. It describes the current project state and does not present these decisions as universal best practices.

## 1. Migration From Java Swing To A Web Application

Context: the original workflow came from a Java Swing application and spreadsheets used in a family-owned store.

Decision: migrate to a web architecture with Spring Boot, React, and PostgreSQL.

Reasons:

- Separate UI, business rules, and persistence.
- Improve maintainability through modules.
- Allow browser-based use on the store computer.
- Keep the API documentable with Swagger in development.

Consequences:

- Backend, frontend, and database must be managed.
- Docker reduces friction for local installation.
- Historical migration is treated as a controlled process, not a normal user workflow.

## 2. Monorepo

Context: backend, frontend, Docker, scripts, and documentation evolve together.

Decision: keep them in one repository.

Reasons:

- Easier review of frontend-backend contracts.
- Documentation stays close to the code.
- Compose, scripts, and guides are simpler to coordinate.

Consequences:

- Changes in one layer must be checked against the others.
- Verification should include backend, frontend, and Docker when relevant.

## 3. PostgreSQL As The Main Database

Context: the system manages sales, cash, inventory, accounts receivable, suppliers, and historical relationships.

Decision: use PostgreSQL.

Reasons:

- Strong relational support, constraints, indexes, and transactions.
- Compatible with Docker Compose for local installation.
- Suitable for stock, cash, and balance consistency.

Consequences:

- Backup and restore discipline is required.
- Migrations must remain compatible with existing data.

## 4. Flyway And `ddl-auto=validate`

Context: the schema must evolve without losing historical data.

Decision: version the schema with Flyway and use Hibernate only for validation.

Reasons:

- SQL migrations are auditable.
- Prevents unreviewed automatic database changes.
- Detects entity-table mismatches at startup.

Consequences:

- Every schema change requires a new migration.
- Applied migrations should not be edited.

## 5. Stateless JWT

Context: the API needs authentication for store users and roles.

Decision: use Bearer JWT with Spring Security.

Reasons:

- Keeps the backend stateless.
- Fits the SPA frontend and Axios HTTP client.
- Allows user and role claims.

Consequences:

- The frontend stores the token in `localStorage`.
- Refresh tokens and advanced rotation are not implemented in the current version.
- Expiration depends on `JWT_EXPIRATION_MINUTES`.

## 6. Feature-Based Architecture

Context: NovaPOS has distinct business modules: sales, cash, inventory, suppliers, accounts receivable, and catalogs.

Decision: organize backend and frontend by feature.

Reasons:

- Reduces coupling between modules.
- Makes controllers, services, repositories, hooks, and pages easier to locate.
- Allows each feature to own DTOs, mappers, and rules.

Consequences:

- Shared utilities must be kept from becoming too broad.
- Consistent conventions matter.

## 7. Soft Delete For Operational Catalogs

Context: products, categories, customers, suppliers, and users can appear in historical operations.

Decision: deactivate records through `active` where applicable instead of physically deleting them.

Reasons:

- Preserves sales, movements, accounts, and historical reports.
- Avoids breaking foreign keys.
- Keeps traceability.

Consequences:

- Queries must filter active records where appropriate.
- Some operations must prevent deactivation when active dependencies exist, such as customers with outstanding balances.

## 8. Product Separated From Inventory Movements

Context: the system needs current stock lookup and also an explanation for stock changes.

Decision: store current stock in `products.current_stock` and record every change in `inventory_movements`.

Reasons:

- Fast current-stock queries.
- Traceability by sale, return, cancellation, entry, exit, or supplier operation.
- Previous and new stock snapshots.

Consequences:

- Stock operations must be transactional.
- The frontend must not update stock optimistically.

## 9. Sales And Supplier Historical Snapshots

Context: prices, names, and costs can change over time.

Decision: store snapshots in sales, entries, and settlements.

Reasons:

- A historical sale must preserve the data used at the time.
- Supplier settlements should not be recalculated with current prices.
- Historical import can preserve source differences.

Consequences:

- More historical columns are required.
- Reports must choose between current value and snapshot depending on the case.

## 10. Docker For Local Operation

Context: the store needs a reproducible installation without requiring Maven, Node.js, or an IDE for daily use.

Decision: use Docker Compose with `db`, `backend`, and `frontend`.

Reasons:

- Persistent PostgreSQL volume.
- Backend and frontend run from reproducible images.
- Nginx can serve React and proxy `/api` from the same origin.

Consequences:

- Docker Desktop must start before using NovaPOS.
- Scripts and guides are needed for installation, status, logs, backup, restore, and update.

## 11. Nginx In Local Production Deployment

Context: Vite is suitable for development, not for production serving.

Decision: build React and serve `dist` with Nginx in `Dockerfile.prod`.

Reasons:

- Smaller final image than the development container.
- `try_files` supports React Router.
- `/api` proxy avoids exposing the backend directly to the host.

Consequences:

- `VITE_*` variables are fixed at frontend build time.
- API URL changes require rebuilding the image if they affect the bundle.

## 12. Backups As A Store Operation

Context: the local database contains important operational data.

Decision: create PowerShell scripts for backup, restore, update, and daily scheduled tasks.

Reasons:

- Avoid manual commands with passwords.
- Validate `.dump` files with `pg_restore -l`.
- Create a preventive backup before restore/update.

Consequences:

- Restore requires explicit confirmation.
- Backups must be stored outside the repository and preferably outside the main store computer.
