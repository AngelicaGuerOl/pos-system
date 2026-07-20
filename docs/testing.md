# Testing And Verification

NovaPOS has automated backend tests and frontend verification through lint/build commands. The current version does not include a frontend test runner, end-to-end suite, CI workflow, or coverage report.

## Current Strategy

| Area | Status |
| --- | --- |
| Backend unit/service tests | Implemented in several modules. |
| Backend controller tests | Implemented in main modules. |
| DTO validation | Implemented for sensitive requests. |
| Spring context | Implemented. |
| Frontend lint | Implemented with Oxlint. |
| Frontend typecheck/build | Implemented through `npm run build`. |
| Frontend unit/component tests | Not configured. |
| End-to-end tests | Not configured. |
| CI | Not configured. |
| Coverage | Not configured. |

## Backend Tests

Existing tests confirmed under `pos-backend/src/test/java`:

| Module | Existing coverage |
| --- | --- |
| Application | Spring context loading. |
| Products | Product service. |
| Inventory | Controller, service, and manual movement validation. |
| Cash | Movement controller/service and cash session service. |
| Sales | Controller, service, and request validation. |
| Cancellations | Cancellation service. |
| Accounts receivable | Controller and service. |
| Payments | Controller and service. |
| Dashboard | Summary service. |
| Reports | Operations report service. |
| Suppliers | Supplier service. |
| Supplier settlements | Excel export. |

Command:

```bash
cd pos-backend
./mvnw clean verify
```

PowerShell:

```powershell
cd pos-backend
.\mvnw.cmd clean verify
```

Run the full verification when changes affect MapStruct, security, transactional rules, migrations, DTOs, or controllers.

## Frontend Verification

Real scripts defined in `pos-frontend/package.json`:

```bash
cd pos-frontend
npm run lint
npm run build
```

`npm run lint` runs Oxlint. `npm run build` runs `tsc -b` and `vite build`, so it works as both typecheck and production build.

There is no `npm test` script in the current version.

## Docker

`docker-compose.prod.yml` is an override and is not valid by itself. This command fails because the base service definitions are missing:

```bash
docker compose -f docker-compose.prod.yml config
```

The correct static validation for local production deployment uses both files:

```bash
docker compose --env-file .env \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  config
```

Do not use `docker compose down -v` as part of normal verification.

## Recommended Manual Flows

### Cash Sale

```text
Open cash session
-> Register cash sale
-> Verify stock
-> Verify cash movement
-> Close cash session
```

### Credit Sale

```text
Register customer
-> Register credit sale
-> Verify receivable
-> Register payment
-> Verify balance and cash movement
```

### Return Or Cancellation

```text
Register sale
-> Return products or cancel
-> Verify inventory
-> Verify cash or receivable
```

### Suppliers

```text
Register supplier
-> Assign products
-> Create opening inventory
-> Register merchandise
-> Create and finalize settlement
-> Export Excel
```

### Security

```text
Login ADMIN
-> Review administrative modules
-> Login CASHIER
-> Confirm UI restrictions
-> Confirm backend rejects non-permitted routes
```

## Results From This Documentation Review

Real command results from a documentation review should be reported in the final delivery. They are not documented here as a permanent guarantee because results can change with new modifications.

## Limitations

- No measured coverage percentage.
- No automated UI tests.
- No E2E tests.
- No CI pipeline in the repository.
- PowerShell scripts require Windows verification before claiming real execution.
