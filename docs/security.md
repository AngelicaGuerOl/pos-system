# Security

NovaPOS uses Spring Security with stateless JWT authentication. The backend is the source of truth for access control; frontend route guards improve navigation but do not replace backend authorization.

## Authentication

Users authenticate through `POST /api/auth/login`. The backend validates credentials with Spring Security and returns a JWT. The token includes the subject, user id, role, issued-at time, and expiration.

JWT behavior is configured through:

- `JWT_SECRET`
- `JWT_EXPIRATION_MINUTES`
- `security.jwt.*` properties

The secret must be Base64 or Base64URL encoded and decode to at least 32 bytes. Passwords are hashed with BCrypt through the configured `PasswordEncoder`.

Only active users can be loaded by `CustomUserDetailsService`. Inactive users are not accepted by the authentication layer.

The `MustChangePasswordFilter` blocks authenticated users marked with `mustChangePassword` from accessing business endpoints until they change their password. Allowed paths during that state are login, current-user lookup, and password change.

## Authorization

The system has two roles:

| Area | ADMIN | CASHIER |
| --- | --- | --- |
| Dashboard | Global summary | Own cash/session summary |
| Users | Manage and list | No management access |
| Categories | Create/update/deactivate and read | Read |
| Products | Create/update/deactivate and read | Read |
| Customers | Create/update/read/deactivate | Create/update/read |
| Inventory movements | Manage and view | No administrative inventory access |
| Cash sessions | Open/close own, view history | Open/close own |
| Cash movements | Own current cash movements | Own current cash movements |
| Sales | Create, cancel, return, view history | Create, cancel/return permitted sales, view permitted history |
| Receivables and payments | Administrative receivable list plus payments | Permitted customer and payment operations |
| Reports | Administrative reports | No report access |
| Suppliers, entries, settlements | Full supplier control | No supplier control |

`SecurityConfig` defines the HTTP authorization rules. Some service methods add additional access checks, such as restricting non-admin sale detail, return, or cancellation access to sales created by the authenticated user.

Frontend route guards mirror the role model for navigation, but they are not considered security boundaries. A user who bypasses the frontend still has to pass backend JWT validation and Spring Security authorization.

## Public and Protected Endpoints

Public access is limited to:

- `POST /api/auth/login`
- CORS preflight `OPTIONS` requests
- Swagger/OpenAPI paths when Springdoc is enabled by profile

Most business endpoints require a valid Bearer token. Swagger paths are permitted by security configuration, but Springdoc itself is disabled outside the configured development profile.

## Error Handling

Security and application errors are returned as JSON using the shared `ErrorResponse` shape:

- `400 Bad Request` for invalid input and validation failures.
- `401 Unauthorized` for missing, invalid, or expired authentication.
- `403 Forbidden` for role or password-change restrictions.
- `404 Not Found` for missing resources.
- `409 Conflict` for business conflicts.
- `500 Internal Server Error` for unhandled failures.

Bean Validation and constraint errors include field-level validation information when available through `validationErrors`.

## Secrets and Configuration

Runtime configuration is loaded from `.env` and environment variables. `.env.example` documents the required values. Real secrets must not be committed.

Important values include:

- `JWT_SECRET`
- `JWT_EXPIRATION_MINUTES`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `BOOTSTRAP_ADMIN_USERNAME`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `SPRING_PROFILES_ACTIVE`

Bootstrap admin credentials are intended for initialization and must be changed before real use.

## CORS and Profiles

CORS defaults to the local Vite frontend origins:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

The active origins can be configured through `app.cors.allowed-origins`.

Swagger/OpenAPI availability:

| Profile | Swagger/OpenAPI |
| --- | --- |
| `dev` | Enabled |
| `test` | Disabled |
| `prod` | Disabled |
| default base configuration | Disabled unless overridden |

The root application configuration defaults the active profile to `dev`, while `.env.example` sets `SPRING_PROFILES_ACTIVE=prod` for the Docker stack template.

## Current Security Scope

Implemented:

- BCrypt password hashing.
- JWT authentication.
- Backend role authorization.
- Active-user validation.
- Forced password-change filter.
- Environment-based secrets.
- Development-only Swagger through profile configuration.

## Local Store Production

The Windows local store production setup runs the backend with the `prod` profile. In that profile, Swagger/OpenAPI is disabled by Spring configuration.

Only the frontend container publishes a host port, bound by default to `127.0.0.1:${NOVAPOS_FRONTEND_PORT:-80}`. The backend and PostgreSQL services remain inside the Docker network and do not publish host ports. This keeps NovaPOS available from the same computer at `http://localhost` without automatically exposing it to other computers on the local network or to the Internet.

Security-sensitive operational decisions are handled server-side. Examples include stock validation, cash session lookup, receivable payment limits, sale access checks, supplier administration, and report visibility.

Not implemented in the current codebase:

- Refresh-token rotation.
- Multi-factor authentication.
- Rate limiting.
- Encryption at rest.
- Advanced audit monitoring.
