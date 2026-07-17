# Testing

NovaPOS currently has automated backend tests and frontend quality checks. There is no frontend test runner, end-to-end suite, CI workflow, or coverage reporting configured in the repository.

## Testing Overview

Verified test types:

- Backend service tests.
- Backend controller tests.
- Backend DTO validation tests.
- Spring context loading test.

The frontend is verified through linting and production build checks.

The test suite focuses on high-risk backend behavior: transactional workflows, validation, financial calculations, stock movement side effects, and access-sensitive operations. It is not intended to be exhaustive coverage of every controller or UI state.

Most backend tests are organized close to the feature they verify. Service tests exercise business rules directly with mocked collaborators, while controller tests verify HTTP behavior, validation, security integration, and response contracts where present.

## Backend Tests

Existing backend tests cover important flows in:

| Area | Test coverage present |
| --- | --- |
| Application context | Spring context loading. |
| Products | Product service behavior. |
| Inventory movements | Controller, service, and request validation. |
| Cash movements | Controller, service, and request validation. |
| Cash sessions | Cash session service behavior. |
| Sales | Controller, service, and request validation. |
| Sale cancellations | Cancellation service behavior. |
| Accounts receivable | Controller and service behavior. |
| Receivable payments | Controller and service behavior. |
| Dashboard | Dashboard service summaries. |
| Reports | Operations report service behavior. |
| Suppliers | Supplier service behavior. |
| Supplier settlement export | Excel export service behavior. |

Run backend verification:

```bash
cd pos-backend
./mvnw clean verify
```

Windows PowerShell:

```powershell
cd pos-backend
.\mvnw.cmd clean verify
```

When a backend change touches MapStruct mappings, Flyway validation, Spring Security rules, or service transactions, run the full Maven verification instead of a single test class. This catches generated mapper errors and application context failures.

## Frontend Quality Checks

The frontend scripts are defined in `pos-frontend/package.json`.

```bash
cd pos-frontend
npm ci
npm run lint
npm run build
```

`npm run lint` runs Oxlint. `npm run build` runs TypeScript project build and Vite production build.

Use `npm ci` instead of `npm install` for reproducible local checks because the repository includes `package-lock.json`.

Frontend verification should be run after changes to routes, shared components, feature dependencies, API mappers, form schemas, or TypeScript domain models. The build step is especially important because it catches type errors that linting may not report.

## Manual Regression Flows

These flows are useful after changes that touch sales, cash, inventory, receivables, suppliers, or authentication.

Manual checks should use realistic but non-sensitive sample data. Avoid using real customer names, real supplier files, or private sales values when preparing portfolio demos or screenshots.

### Cash Sale Flow

```text
Open cash session
-> Register cash sale
-> Verify inventory movement and stock
-> Verify cash movement
-> Close session
```

### Credit Flow

```text
Register credit sale
-> Verify account receivable
-> Register customer payment
-> Verify balance and cash movement
```

### Return or Cancellation Flow

```text
Register sale
-> Return items or cancel sale
-> Verify stock restoration
-> Verify cash or receivable adjustment
```

### Supplier Flow

```text
Register merchandise entry
-> Start supplier settlement
-> Capture final inventory
-> Finalize settlement
-> Export Excel
```

### Historical Import Review

```text
Run preview
-> Review generated warnings
-> Execute only if there are no blocking errors
-> Verify suppliers, entries, settlements, and current stock
```

### Security Flow

```text
Login as ADMIN
-> Verify administrative modules
-> Login as CASHIER
-> Verify restricted modules are not accessible
```

## Testing Limitations

Current limitations:

- No frontend automated tests are configured.
- No browser end-to-end tests are configured.
- No GitHub Actions workflow exists in the repository.
- No coverage report command is configured.
- Dockerized integration test orchestration is not documented as an automated workflow.

These limitations do not prevent local verification, but they are candidates for future improvements.

For larger future changes, the most valuable additions would be frontend component tests, end-to-end tests for sales and cash workflows, and a CI workflow that runs Maven verification plus frontend lint/build on every pull request.
