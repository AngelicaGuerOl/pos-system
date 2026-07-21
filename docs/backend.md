# Backend

The NovaPOS backend is a Spring Boot REST API located in `pos-backend`. It exposes HTTP contracts under `/api` and is responsible for business rules, security, transactions, and PostgreSQL persistence through Spring Data JPA and Flyway.

## Versions And Dependencies

Versions confirmed in `pos-backend/pom.xml`:

| Technology | Version / use |
| --- | --- |
| Java | 17 |
| Spring Boot | 4.1.0 |
| Spring Web MVC | `spring-boot-starter-webmvc` |
| Spring Data JPA | Persistence with Hibernate |
| Spring Security | Authentication and authorization |
| JWT | JJWT 0.13.0 |
| PostgreSQL | Runtime driver, PostgreSQL 16 in Docker Compose |
| Flyway | Versioned SQL migrations |
| MapStruct | 1.6.3 |
| Lombok | Modeling and boilerplate reduction |
| Bean Validation | DTO validation |
| Springdoc OpenAPI | 3.0.3 |
| Apache POI | 5.4.1 for Excel |
| Tests | Spring Boot Test, Web MVC, JPA, Flyway, and Validation test starters |

## Package Structure

The application is organized by feature under `com.angelica.pos`:

```text
auth/
cash/movement/
cash/session/
catalog/category/
catalog/product/
customer/
dashboard/
inventory/movement/
legacy/importer/
receivable/
receivable/payment/
report/
sale/
sale/cancellation/
sale/returning/
security/
shared/
supplier/
supplier/entry/
supplier/settlement/
user/
```

The typical module structure includes:

| Layer | Responsibility |
| --- | --- |
| `controller` | REST endpoints, parameters, validation, and HTTP responses. |
| `dto` | Request and response contracts. |
| `service` | Business rules, calculations, contextual authorization, and transactions. |
| `repository` | Data access with Spring Data JPA, queries, pagination, and locks. |
| `entity` | JPA mapping for tables and relationships. |
| `mapper` | Entity/DTO conversion with MapStruct. |
| `exception` | Domain errors handled by the global handler. |

## Implemented Modules

- `auth`: login, current user, and password change.
- `user`: user management, roles, active/inactive users, and safeguards against leaving the system without active administrators.
- `catalog/category` and `catalog/product`: catalogs, search, pagination, update, deactivation, reactivation, local barcode lookup, and optional Open Food Facts lookup for unregistered barcodes.
- `customer`: customers for sales and accounts receivable.
- `cash/session`: opening, lookup, closing, closing preview, and session history.
- `cash/movement`: manual inflows/outflows, summaries, and session movements.
- `sale`: cash and credit sales, history, details, and current-session sales.
- `sale/cancellation`: sale cancellation with inventory, cash, or receivable adjustment.
- `sale/returning`: partial or full returns with cash and credit rules.
- `receivable` and `receivable/payment`: accounts receivable, balances, details, and payments.
- `inventory/movement`: entries, exits, product movements, and traceability.
- `supplier`: suppliers, supplier products, and opening inventory.
- `supplier/entry`: merchandise entry registration and history.
- `supplier/settlement`: supplier settlements, finalization, and Excel export.
- `dashboard` and `report`: operational summary and administrative reports.
- `legacy/importer`: controlled historical import through the `legacy-import` profile.

## Open Food Facts Barcode Lookup

The product catalog includes two barcode lookup paths:

- `/api/products/barcode/{barcode}` searches only the local catalog and returns an existing product.
- `/api/products/barcode-lookup/{barcode}` searches the local catalog first and, when the barcode is not local, can query Open Food Facts.

External lookup is limited to numeric barcodes with 6 to 18 digits. The backend requests only a small field set from Open Food Facts: `code`, `product_name_es`, `product_name`, `brands`, and `quantity`. The response is normalized into `BarcodeLookupResponse` with one of three statuses: `LOCAL_PRODUCT_EXISTS`, `EXTERNAL_MATCH`, or `NOT_FOUND`.

Open Food Facts data is treated as a suggestion, not as trusted catalog data. NovaPOS does not create a product automatically from the external response; the frontend uses the suggested name, brand, and presentation to help the operator complete the product or supplier entry form. If the external service is unavailable, the user can continue with manual capture.

Configuration is read through `app.open-food-facts.base-url` and `app.open-food-facts.user-agent`, backed by `OPEN_FOOD_FACTS_BASE_URL` and `OPEN_FOOD_FACTS_USER_AGENT`. The RestClient uses a 2-second connection timeout and 3-second read timeout.

## Security

The real roles are `ADMIN` and `CASHIER`. Spring Security applies route rules in `SecurityConfig`:

- `POST /api/auth/login` is public.
- `/api/auth/me` and `/api/auth/change-password` require authentication.
- Users, reports, suppliers, supplier entries, supplier settlements, and administrative inventory require `ADMIN`.
- Products, categories, and customers allow read access for `ADMIN` and `CASHIER`; write access depends on the route.
- Sales, cash, returns, cancellations, and payments allow `ADMIN` and `CASHIER` with additional service-level restrictions when needed.
- Swagger/OpenAPI paths are allowed by security configuration, but Springdoc disables them outside the `dev` profile.

Authentication is stateless with Bearer JWT. Passwords are hashed with BCrypt. `MustChangePasswordFilter` blocks business endpoints when the user must change their password.

## Validation And Errors

DTOs use Bean Validation for HTTP input. Business rules are validated in services, for example:

- sales with at least one product;
- enough stock;
- credit sales requiring a customer;
- payments that do not exceed outstanding balance;
- open cash session for cash-related operations;
- active supplier for merchandise entries;
- only one draft supplier settlement per supplier;
- settlement finalization with delivered amount and notes when differences exist.

`GlobalExceptionHandler` centralizes errors and returns `ErrorResponse`. The system uses HTTP codes such as `400`, `401`, `403`, `404`, `409`, and `500`.

## Transactions And Consistency

Services use `@Transactional` for write flows and `@Transactional(readOnly = true)` for reads where appropriate. Repositories use pessimistic locks for operations that can affect stock, cash sessions, suppliers, receivables, or settlements.

Relevant atomic flows:

- Creating a sale persists the sale, items, inventory movement, and cash or receivable effect.
- Registering a return validates quantities, restores stock, and adjusts cash or receivable state.
- Canceling a sale records cancellation, restores stock, and adjusts cash or receivable state.
- Registering a payment updates the balance and creates a cash movement.
- Registering merchandise updates stock and historical/current prices.
- Finalizing a supplier settlement calculates differences and adjusts inventory.

## Pagination

The main queries use `Pageable`, `@PageableDefault`, and `PageResponse`. Services validate maximum page sizes to avoid oversized responses.

## Profiles And Configuration

- `application.yml`: base configuration, `ddl-auto=validate`, Flyway enabled, Springdoc disabled by default.
- `application-dev.yml`: local datasource, SQL logging, Swagger/OpenAPI enabled.
- `application-prod.yml`: required datasource variables and Swagger/OpenAPI disabled.
- `application-test.yml`: test configuration.

The backend imports `.env` from the backend directory or repository root through `spring.config.import`.

## Flyway

Migrations are stored in `pos-backend/src/main/resources/db/migration` and currently go through `V19`. Applied migrations should not be edited; schema changes must be added as new versioned migrations.

Hibernate uses `ddl-auto=validate`, so it validates the match between entities and the database without creating or updating tables automatically.

## Backend Tests

Tests exist in `pos-backend/src/test/java` for services, controllers, validations, and Spring context loading. The real command is:

```bash
cd pos-backend
./mvnw clean verify
```

On Windows:

```powershell
cd pos-backend
.\mvnw.cmd clean verify
```
