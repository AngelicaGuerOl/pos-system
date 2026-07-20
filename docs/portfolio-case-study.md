# Portfolio Case Study: NovaPOS

## Context

NovaPOS started from a concrete need in a family-owned store: register sales, control inventory, manage cash sessions, track credit purchases, and handle supplier merchandise with less dependence on manual processes.

The previous system was based on a Java Swing application and spreadsheets. That solution supported store operations, but it made business rules, historical records, data validation, and reproducible installation harder to maintain.

The target user is someone who operates or manages a small local retail business with daily sales, cash, product, customer, accounts receivable, and supplier workflows.

## Goal

The technical goal was to migrate the system to a maintainable web architecture:

- separate frontend, backend, and database responsibilities;
- centralize business rules in the backend;
- preserve sales, inventory, and supplier history;
- use PostgreSQL with controlled migrations;
- enable reproducible local deployment with Docker;
- document the system for development, operation, and professional presentation.

## My Role

I analyzed the existing system and modeled the main store workflows: sales, cash, inventory, accounts receivable, customers, suppliers, and settlements.

I designed and implemented a Spring Boot backend architecture organized by feature, with DTOs, services, repositories, MapStruct, validations, global error handling, JWT security, and roles.

I modeled the PostgreSQL database with Flyway migrations, constraints, and indexes to preserve consistency in stock, sales, cash, receivables, and supplier operations.

I implemented the frontend in React with TypeScript, Vite, Material UI, AG Grid, React Hook Form, Zod, a shared HTTP client, protected routes, and a feature-based structure.

I prepared Docker configuration for development and local production deployment, including Nginx as the static frontend server and `/api` proxy to the backend.

I added PowerShell scripts for local installation, start, stop, status, logs, backups, restore, update, and desktop shortcuts.

I also documented the architecture, development setup, API, database, testing, local production deployment, backups, user guide, technical decisions, and project status.

## Technical Challenges

### Migration From Swing And Spreadsheets

The main challenge was moving rules that were previously scattered into a web architecture with clear responsibilities. Historical import was implemented as a dedicated backend process, separate from normal application use.

### Transactional Stock Control

Sales, returns, cancellations, merchandise entries, and supplier settlements modify inventory. The backend uses transactional services, locks, and inventory movements to keep current stock and traceability aligned.

### Historical Records And Snapshots

A sale or settlement should not change when the product later changes. For that reason, the system stores snapshots of names, barcodes, units, prices, costs, and historical values where needed.

### Credit Sales And Accounts Receivable

Credit sales create accounts receivable. Payments update balances and generate cash movements. Returns and cancellations require different rules depending on whether the sale already has payments or adjustments.

### Cash Sessions And Closing

Cash sessions record inflows, outflows, sales, payments, returns, and cancellations. Closing stores a snapshot so later review does not depend on changing recalculations.

### Suppliers And Settlements

The supplier workflow includes opening inventory, merchandise entries, draft settlement, final inventory capture, finalization, and Excel export. The settlement formula preserves a supplier-control model independent from POS sales.

### Local Deployment

The application is designed to run locally on a store computer. Docker Compose separates development and local production deployment, while Nginx avoids exposing the backend and database directly to the host.

### Backups And Recovery

The local database needs backups. Scripts use `pg_dump -Fc`, validate with `pg_restore -l`, and require a preventive backup before restore.

## Decisions And Lessons Learned

Spring Boot made it practical to concentrate business rules and security in a clear API. PostgreSQL and Flyway made the database a versioned part of the system. React with a feature-based structure kept administrative screens and store workflows organized.

An important decision was to avoid deleting historical data and prefer active/inactive states. Another was to separate current stock from inventory movements so the system can provide both fast lookup and auditability.

It was also important to distinguish development from local production deployment: Vite and published development ports are useful while coding; Nginx, `prod` profiles, a separate volume, and operation scripts are more appropriate for daily store use.

## Current Result

The project currently includes:

- functional Spring Boot backend;
- functional React frontend;
- PostgreSQL with Flyway migrations;
- JWT security with `ADMIN` and `CASHIER` roles;
- sales, cash, inventory, accounts receivable, supplier, report, and user modules;
- local Docker deployment with Nginx;
- PowerShell operation scripts;
- automated backend tests;
- frontend lint/build verification;
- technical and operational documentation.

## Limitations

- No automated frontend tests.
- No end-to-end suite.
- No CI configured.
- No refresh tokens, MFA, rate limiting, encryption at rest, or advanced monitoring.
- No cloud deployment documented.
- PowerShell scripts require manual verification on Windows before a real installation.

## Roadmap

- Add frontend and E2E tests for sales, cash, and inventory.
- Configure CI for backend and frontend.
- Improve operational auditability and security hardening.
- Refine support documentation for real store installation.
