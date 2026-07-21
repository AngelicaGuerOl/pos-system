# Security

NovaPOS uses Spring Security with stateless JWT authentication. The backend is the source of truth for permissions; frontend guards only control navigation.

## Authentication

Users log in with:

```text
POST /api/auth/login
```

The backend validates credentials with Spring Security and returns a JWT. The token includes username, id, role, issued-at time, and expiration.

Relevant configuration:

- `JWT_SECRET`
- `JWT_EXPIRATION_MINUTES`
- `security.jwt.*` properties

`JWT_SECRET` must be Base64/Base64URL and decode to at least 32 bytes. A suitable value can be generated with `openssl rand -base64 32`. Passwords are stored with BCrypt.

Only active users can authenticate. `MustChangePasswordFilter` blocks business endpoints when a user has `mustChangePassword=true`; in that state the user can only fetch the current user and change their password.

## Roles

Implemented roles:

| Role | Scope |
| --- | --- |
| `ADMIN` | User management, catalogs, inventory, suppliers, reports, accounts receivable, and administrative history. |
| `CASHIER` | Cash operation, sales, customers, and backend-permitted queries/actions. |

## Authorization

`SecurityConfig` defines rules by method and route:

- Public login.
- Dashboard for `ADMIN` and `CASHIER`.
- Users and reports for `ADMIN`.
- Suppliers, supplier entries, and supplier settlements for `ADMIN`.
- Category/product writes for `ADMIN`; reads for `ADMIN` and `CASHIER`.
- Customers for both roles, except deactivation restricted to `ADMIN`.
- Cash, sales, returns, cancellations, and payments for both roles with additional service rules.
- Administrative cash history and global receivables for `ADMIN`.

Some services add contextual validation, such as cashier access to permitted sales.

## Public And Protected Endpoints

Public:

- `POST /api/auth/login`
- preflight `OPTIONS`
- Swagger/OpenAPI only when Springdoc is enabled by the `dev` profile

All other business endpoints require a valid Bearer token.

## Error Handling

Errors are returned as JSON with `ErrorResponse`:

- `400 Bad Request`: invalid input.
- `401 Unauthorized`: missing or invalid authentication.
- `403 Forbidden`: insufficient role or pending password change.
- `404 Not Found`: missing resource.
- `409 Conflict`: business conflict.
- `503 Service Unavailable`: external product catalog unavailable.
- `500 Internal Server Error`: unhandled error.

## CORS And Profiles

Default CORS allows:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

It is configured with `app.cors.allowed-origins`.

| Profile | Swagger/OpenAPI |
| --- | --- |
| `dev` | Enabled |
| `test` | Disabled |
| `prod` | Disabled |

## Local Production Deployment

In `docker-compose.prod.yml`, only Nginx publishes a host port. Backend and PostgreSQL do not publish ports. By default the application is available at:

```text
127.0.0.1:${NOVAPOS_FRONTEND_PORT:-80}
```

## Implemented

- BCrypt password hashing.
- Bearer JWT.
- `ADMIN` and `CASHIER` roles.
- Active-user validation.
- Forced password-change filter.
- Swagger disabled in `prod`.
- Backend as the permission authority.

## Not Implemented

- Refresh-token rotation.
- MFA.
- Rate limiting.
- Encryption at rest.
- Advanced audit monitoring.
- Centralized secret management.
