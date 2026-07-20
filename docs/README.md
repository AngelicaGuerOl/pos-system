# NovaPOS Documentation

This directory contains NovaPOS technical, functional, and operational documentation. It is intended for developers, maintainers, and technical reviewers who need to understand the system without reading the entire codebase first.

The main project entry points are [README.md](../README.md) in English and [README.es.md](../README.es.md) in Spanish.

## Main Index

- [Architecture](architecture.md): system overview, components, request flows, modules, and architectural decisions.
- [Backend](backend.md): Spring Boot structure, layers, security, DTOs, services, repositories, MapStruct, profiles, and backend tests.
- [Frontend](frontend.md): React structure, routes, features, forms, validation, tables, HTTP client, and verification.
- [Database](database.md): PostgreSQL, Flyway, main tables, relationships, constraints, indexes, and migration rules.
- [API](api.md): base URL, authentication, errors, pagination, Swagger, and endpoint groups.
- [Local development](development.md): Docker, Maven, and npm execution for day-to-day development.
- [Testing](testing.md): real commands, existing test scope, and current limitations.
- [User guide](user-guide.md): Spanish user-facing guide for sales, cash, inventory, accounts receivable, and suppliers.
- [Local production deployment](store-deployment.md): Spanish Windows/Docker Desktop installation and operation guide for store support.
- [Backup and restore](backup-restore.md): Spanish operational guide for `.dump` backups, validation, restore, and computer recovery.
- [Technical decisions](technical-decisions.md): simplified ADR-style record of the main technical decisions.
- [Portfolio case study](portfolio-case-study.md): technical project story, scope, challenges, and current state.

## Supporting Documents

- [Business rules](business-rules.md): backend-enforced rules for sales, cash, inventory, accounts receivable, and suppliers.
- [Security](security.md): JWT authentication, roles, CORS, profiles, errors, and current security scope.
- [Legacy import](legacy-import.md): controlled spreadsheet migration through a dedicated backend profile.

## Sources Of Truth

- Detailed HTTP contracts: Swagger UI when the backend runs with the `dev` profile.
- Database schema: Flyway migrations in `pos-backend/src/main/resources/db/migration`.
- Runtime configuration: `application*.yml`, `.env.example`, and Docker Compose files.
- Windows local operation: scripts in `scripts/`.

## Accuracy Note

This documentation describes the current project state. Capabilities that are not implemented, such as CI, automated frontend tests, refresh tokens, MFA, rate limiting, or cloud deployment, are documented as limitations or roadmap items rather than finished features.
