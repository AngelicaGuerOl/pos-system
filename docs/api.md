# API

The NovaPOS API is REST/JSON and is exposed under the `/api` prefix. The Spring Boot backend is the source of truth for validations, business rules, security, and persistence.

## Base URL

| Environment | URL |
| --- | --- |
| Direct local backend | `http://localhost:8080/api` |
| Vite frontend with proxy | `/api` from `http://localhost:5173` |
| Local production with Nginx | `/api` from `http://localhost` or the configured port |

In local production Docker, the browser calls Nginx and Nginx proxies `/api` to `http://backend:8080`.

## Swagger / OpenAPI

Swagger is available only with the `dev` profile:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- OpenAPI YAML: `http://localhost:8080/v3/api-docs.yaml`

In `prod`, Springdoc is disabled by configuration.

## Authentication

Login:

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "username": "admin",
  "password": "configured-password"
}
```

The response includes a JWT and user data. Real tokens must not be documented or shared.

Authenticated requests:

```http
Authorization: Bearer <jwt>
```

The JWT includes subject, user id, role, issued-at time, and expiration. Duration is configured with `JWT_EXPIRATION_MINUTES`.

## Errors

Errors are returned as JSON through `ErrorResponse`. The exact shape is defined in `com.angelica.pos.shared.exception.ErrorResponse`.

Conceptual example:

```json
{
  "timestamp": "2026-07-20T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "The request is not valid",
  "path": "/api/products",
  "validationErrors": {
    "name": "must not be blank"
  }
}
```

HTTP codes used by the backend:

| Code | Use |
| --- | --- |
| `200 OK` | Successful read or action with response. |
| `201 Created` | Resource creation. |
| `400 Bad Request` | Invalid input or failed validation. |
| `401 Unauthorized` | Missing, invalid, or expired token. |
| `403 Forbidden` | Insufficient role or required password change. |
| `404 Not Found` | Resource not found. |
| `409 Conflict` | Business conflict or duplicate. |
| `500 Internal Server Error` | Unhandled failure. |

## Pagination

Paginated endpoints use Spring `Pageable`-compatible parameters:

```text
?page=0&size=10&sort=createdAt,desc
```

Responses use `PageResponse`, including content and pagination metadata. Several services validate maximum page sizes.

## Endpoint Groups

The following is a summarized list confirmed from controllers. Use Swagger UI for DTOs, full examples, and exact parameters.

### Authentication

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/me` | Authenticated |
| `POST` | `/api/auth/change-password` | Authenticated |

### Users

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/users` | `ADMIN` |
| `GET` | `/api/users` | `ADMIN` |
| `GET` | `/api/users/{id}` | `ADMIN` |
| `PUT` | `/api/users/{id}` | `ADMIN` |
| `PATCH` | `/api/users/{id}/deactivate` | `ADMIN` |

### Catalog

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/categories` | `ADMIN` |
| `GET` | `/api/categories` | `ADMIN`, `CASHIER` |
| `GET` | `/api/categories/{id}` | `ADMIN`, `CASHIER` |
| `PUT` | `/api/categories/{id}` | `ADMIN` |
| `PATCH` | `/api/categories/{id}/deactivate` | `ADMIN` |
| `POST` | `/api/products` | `ADMIN` |
| `GET` | `/api/products` | `ADMIN`, `CASHIER` |
| `GET` | `/api/products/{id}` | `ADMIN`, `CASHIER` |
| `GET` | `/api/products/barcode/{barcode}` | `ADMIN`, `CASHIER` |
| `PUT` | `/api/products/{id}` | `ADMIN` |
| `PATCH` | `/api/products/{id}/deactivate` | `ADMIN` |

### Customers And Accounts Receivable

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/customers` | `ADMIN`, `CASHIER` |
| `GET` | `/api/customers` | `ADMIN`, `CASHIER` |
| `GET` | `/api/customers/{id}` | `ADMIN`, `CASHIER` |
| `PUT` | `/api/customers/{id}` | `ADMIN`, `CASHIER` |
| `PATCH` | `/api/customers/{id}/deactivate` | `ADMIN` |
| `GET` | `/api/receivables` | `ADMIN` |
| `GET` | `/api/receivables/{id}` | `ADMIN`, `CASHIER` |
| `GET` | `/api/customers/{customerId}/receivables` | `ADMIN`, `CASHIER` |
| `POST` | `/api/receivables/{receivableId}/payments` | `ADMIN`, `CASHIER` |
| `GET` | `/api/receivables/{receivableId}/payments` | `ADMIN`, `CASHIER` |
| `GET` | `/api/receivable-payments/{id}` | `ADMIN`, `CASHIER` |

### Cash

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/cash-sessions/open` | `ADMIN`, `CASHIER` |
| `GET` | `/api/cash-sessions/current` | `ADMIN`, `CASHIER` |
| `GET` | `/api/cash-sessions/current/closing-preview` | `ADMIN`, `CASHIER` |
| `POST` | `/api/cash-sessions/current/close` | `ADMIN`, `CASHIER` |
| `GET` | `/api/cash-sessions` | `ADMIN` |
| `GET` | `/api/cash-sessions/{id}` | `ADMIN` |
| `GET` | `/api/cash-sessions/{id}/closing-summary` | `ADMIN` |
| `POST` | `/api/cash-movements/entries` | `ADMIN`, `CASHIER` |
| `POST` | `/api/cash-movements/exits` | `ADMIN`, `CASHIER` |
| `GET` | `/api/cash-movements/current` | `ADMIN`, `CASHIER` |
| `GET` | `/api/cash-movements/current/summary` | `ADMIN`, `CASHIER` |
| `GET` | `/api/cash-sessions/{sessionId}/movements` | `ADMIN` |

### Sales

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/sales` | `ADMIN`, `CASHIER` |
| `GET` | `/api/sales/current-session` | `ADMIN`, `CASHIER` |
| `GET` | `/api/sales/{id}` | `ADMIN`, `CASHIER` |
| `GET` | `/api/sales` | `ADMIN` |
| `POST` | `/api/sales/{saleId}/cancel` | `ADMIN`, `CASHIER` |
| `POST` | `/api/sales/{saleId}/returns` | `ADMIN`, `CASHIER` |
| `GET` | `/api/sales/{saleId}/returns` | `ADMIN`, `CASHIER` |
| `GET` | `/api/sale-returns/{returnId}` | `ADMIN`, `CASHIER` |

### Inventory And Suppliers

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/inventory-movements/entries` | `ADMIN` |
| `POST` | `/api/inventory-movements/exits` | `ADMIN` |
| `GET` | `/api/inventory-movements` | `ADMIN` |
| `GET` | `/api/inventory-movements/{id}` | `ADMIN` |
| `GET` | `/api/products/{productId}/inventory-movements` | `ADMIN` |
| `POST` | `/api/suppliers` | `ADMIN` |
| `GET` | `/api/suppliers` | `ADMIN` |
| `GET` | `/api/suppliers/{id}` | `ADMIN` |
| `PUT` | `/api/suppliers/{id}` | `ADMIN` |
| `PATCH` | `/api/suppliers/{id}/deactivate` | `ADMIN` |
| `GET` | `/api/suppliers/{supplierId}/products` | `ADMIN` |
| `POST` | `/api/suppliers/{supplierId}/inventory-baseline` | `ADMIN` |
| `GET` | `/api/suppliers/{supplierId}/inventory-baseline` | `ADMIN` |
| `GET` | `/api/suppliers/{supplierId}/entries` | `ADMIN` |
| `POST` | `/api/supplier-entries` | `ADMIN` |
| `GET` | `/api/supplier-entries` | `ADMIN` |
| `GET` | `/api/supplier-entries/{id}` | `ADMIN` |
| `POST` | `/api/supplier-settlements` | `ADMIN` |
| `PUT` | `/api/supplier-settlements/{id}` | `ADMIN` |
| `POST` | `/api/supplier-settlements/{id}/finalize` | `ADMIN` |
| `GET` | `/api/supplier-settlements` | `ADMIN` |
| `GET` | `/api/supplier-settlements/{id}` | `ADMIN` |
| `GET` | `/api/supplier-settlements/{id}/export` | `ADMIN` |

### Dashboard And Reports

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/dashboard/summary` | `ADMIN`, `CASHIER` |
| `GET` | `/api/reports/operations-summary` | `ADMIN` |
