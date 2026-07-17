# NovaPOS Technical Documentation

This directory contains the technical documentation for NovaPOS. It is intended for developers, maintainers, and technical reviewers who need to understand how the system is structured, how it runs locally, and which business rules are enforced by the backend.

The main project overview remains in the [root README](../README.md). These documents go deeper into architecture, persistence, security, installation, testing, backup operations, and historical data import without duplicating the complete OpenAPI specification.

Use this directory as the starting point when onboarding to the codebase or reviewing how the implementation is organized. The documents describe verified behavior from the local repository: Spring configuration, Docker Compose services, Flyway migrations, security rules, frontend feature structure, and existing tests.

For endpoint-level request and response details, run the backend with the `dev` profile and use Swagger UI instead of copying endpoint tables into Markdown. Keeping API contracts in Swagger and long-lived technical context in this directory reduces duplication and makes the documentation easier to maintain.

## Documents

- [Architecture](architecture.md)  
  Explains the high-level system design, backend and frontend layering, request flow, Docker services, and important architectural decisions.

- [Business Rules](business-rules.md)  
  Describes the core rules enforced by the backend for users, cash sessions, sales, inventory, accounts receivable, returns, cancellations, suppliers, and supplier settlements.

- [Database](database.md)  
  Summarizes the PostgreSQL schema, main tables, relationships, constraints, indexes, transactions, and Flyway migration rules.

- [Security](security.md)  
  Documents JWT authentication, password handling, role authorization, public/protected areas, error handling, CORS, profiles, and the current security scope.

- [Installation](installation.md)  
  Provides the verified setup paths for local development and the Docker-based development stack.

- [Testing](testing.md)  
  Describes the current backend test coverage, frontend quality checks, verification commands, and manual regression flows.

- [Backup and Restore](backup-restore.md)  
  Provides safe PostgreSQL backup and restore procedures for the Docker database service.

- [Legacy Data Import](legacy-import.md)  
  Explains the historical spreadsheet import process, snapshot rules, idempotency, and data privacy considerations.

## Additional Resources

- [Main Project README](../README.md)
- Swagger UI: `http://localhost:8080/swagger-ui.html` when the backend runs with the `dev` profile.
