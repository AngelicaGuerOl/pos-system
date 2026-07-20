# Frontend

The NovaPOS frontend is located in `pos-frontend`. It is a React application with TypeScript and Vite, organized by feature and connected to the backend through Axios over `/api`.

## Versions And Dependencies

Versions confirmed in `pos-frontend/package.json`:

| Technology | Version / use |
| --- | --- |
| React | 19.2.7 |
| TypeScript | 6.0.2 |
| Vite | 8.1.1 |
| React Router | 7.18.1 |
| Material UI | 9.2.0 |
| MUI Icons | 9.2.0 |
| AG Grid | 36.0.0 |
| Axios | 1.18.1 |
| React Hook Form | 7.81.0 |
| Zod | 4.4.3 |
| Oxlint | 1.71.0 |

## Structure

```text
src/
├── app/
│   ├── config/
│   ├── providers/
│   └── router/
├── assets/
├── features/
│   ├── auth/
│   ├── cash/
│   ├── catalog/
│   ├── customers/
│   ├── dashboard/
│   ├── inventory/
│   ├── receivables/
│   ├── reports/
│   ├── sales/
│   └── users/
└── shared/
    ├── api/
    ├── lib/
    ├── routes/
    ├── types/
    ├── ui/
    └── utils/
```

Each feature usually separates:

| Layer | Responsibility |
| --- | --- |
| `domain` | Frontend-facing entities and contracts. |
| `application/useCases` | Use cases that decouple UI from repositories. |
| `infrastructure` | HTTP repositories and API mappers. |
| `ui/pages` | Routed pages. |
| `ui/components` | Screen components, tables, forms, and dialogs. |
| `ui/hooks` | Loading, error, submit, and refetch state. |
| `ui/schemas` | Validation with Zod and React Hook Form. |

## Pages And Routes

Routes confirmed in `routePaths.ts` and `routes.tsx`:

| Route | Module |
| --- | --- |
| `/login` | Login |
| `/change-password` | Password change |
| `/dashboard` | Dashboard |
| `/catalog/categories` | Categories |
| `/catalog/products` | Products |
| `/customers` | Customers |
| `/cash-session/open` | Cash session opening |
| `/cash/movements` | Cash movements |
| `/cash/sessions` | Cash session history |
| `/sales` | New sale |
| `/sales/history` | Sales history |
| `/sales/accounts-receivable/customers/:customerId` | Customer receivable account |
| `/receivables` | Accounts receivable |
| `/inventory/movements` | Inventory movements |
| `/suppliers` | Suppliers |
| `/suppliers/:supplierId/inventory-baseline` | Supplier opening inventory |
| `/inventory/supplier-entries` | Entry history |
| `/inventory/supplier-entries/new` | Inventory receiving |
| `/inventory/supplier-entries/:entryId` | Entry detail |
| `/inventory/supplier-settlements/new` | Create supplier settlement |
| `/inventory/supplier-settlements` | Settlement history |
| `/inventory/supplier-settlements/:settlementId/edit` | Edit settlement |
| `/inventory/supplier-settlements/:settlementId` | Settlement detail |
| `/reports` | Operations report |
| `/users` | Users |

## Authentication And Route Protection

The JWT is stored in `localStorage` through `tokenStorage`. `httpClient` adds `Authorization: Bearer <token>` to requests except login. On `401` responses, it removes the token and redirects to `/login`.

Navigation uses:

- `ProtectedRoute` for authenticated routes;
- `PublicRoute` for login;
- `RoleProtectedRoute` for role-restricted routes;
- `RequireOpenCashSession` to require an open cash session before sales and cash movements.

These protections are user-experience controls. Real authorization is enforced by the backend.

## API Communication

The HTTP client uses `env.apiBaseUrl`, which comes from `VITE_API_BASE_URL`. In development it can point to `http://localhost:8080/api` or use Vite's `/api` proxy. In local production deployment, the build uses `/api` and Nginx proxies to the internal `backend:8080` service.

Typical flow:

```text
Page/Component -> Hook -> Use Case -> Repository -> Axios httpClient -> Spring Boot API
```

Backend errors are normalized with `normalizeApiError` and shown through hooks, forms, alerts, or page states depending on the module.

## UI, Forms, And Tables

- Material UI is used for layout, buttons, dialogs, fields, tabs, chips, alerts, snackbars, and cards.
- AG Grid is used in operational tables such as products, categories, users, cash, accounts receivable, suppliers, inventory, and settlements.
- React Hook Form and Zod validate forms such as login, password change, cash sessions, products, categories, users, sales, and movements.
- Shared components such as `DataGridShell`, `EmptyState`, `LoadingScreen`, `PageContainer`, `PageHeader`, `ConfirmDialog`, and `StatusChip` standardize states.

## UI States

The application implements loading, error, and empty states in the main modules through hooks and shared components. Asynchronous operations show feedback with `Alert`, `Snackbar`, loaders, disabled buttons, or confirmation dialogs depending on the workflow.

## Implemented UI Modules

- Login and password change.
- Role-aware dashboard.
- Categories, products, customers, and users.
- Cash: opening, movements, and closing.
- Sales: new sale, barcode search, history, detail, cancellations, and returns.
- Accounts receivable: customer summary, detail, and payments.
- Inventory: manual movements and lookup.
- Suppliers: catalog, opening inventory, merchandise entries, and settlements.
- Operations report.

## Frontend Tests And Verification

There is no automated frontend test runner configured. The real commands available are:

```bash
cd pos-frontend
npm ci
npm run lint
npm run build
```

`npm run lint` runs Oxlint. `npm run build` runs `tsc -b` and `vite build`.

## Current Limitations

- No frontend unit/component tests.
- No end-to-end tests.
- No PWA or offline operation cache.
- Tokens are stored in `localStorage`; refresh-token rotation is not implemented in the current version.
