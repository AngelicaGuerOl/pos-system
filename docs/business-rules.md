# Business Rules

This document summarizes the main business rules currently enforced by the backend. It does not replace the API contract exposed through Swagger UI.

## Authentication and Users

- Only active users can authenticate and be loaded by the security layer.
- The system uses two roles: `ADMIN` and `CASHIER`.
- JWT tokens include the username, user id, role, issue time, and expiration.
- Users marked with `mustChangePassword` can only access login, current-user lookup, and password-change endpoints until the password is changed.
- User management is restricted to `ADMIN`.

## Cash Sessions

- A cash session represents the cashier's active cash drawer.
- A user can have only one open cash session. This is enforced in service logic and by the partial unique index on open sessions.
- Opening a session requires an initial cash amount.
- Cash sales, receivable payments, manual cash movements, returns with cash refund, and sale cancellation refunds are linked to a cash session.
- The expected cash formula is:

```text
expected cash = opening amount + total inflows - total outflows
```

- Cash closing stores a snapshot of sales, operations, inflows, outflows, counted amount, difference, notes, closing user, and closing time.
- Closed sessions cannot be used for new operations.
- Closing notes are optional, but limited in length.

## Sales

- A sale must contain at least one item and cannot exceed the configured maximum number of lines.
- Products are locked in deterministic order before stock is validated and updated.
- Quantities must be positive and limited to the configured decimal precision.
- Product names, barcodes, units, prices, and costs are stored on sale items as historical snapshots.
- Cash sales require an open cash session and enough cash received to cover the calculated total.
- Credit sales require a customer and do not accept a cash received amount.
- Sale totals are calculated by the backend from product sale prices and requested quantities.
- `ADMIN` can query global sale history; `CASHIER` can query sales allowed by the security and service access rules.

## Accounts Receivable

- Credit sales create an account receivable.
- Receivables track original amount, returned amount, adjusted amount, paid amount, outstanding balance, status, and payment date.
- Customer payments require an open cash session.
- Payments cannot exceed the outstanding balance.
- Payments change the receivable status to `PARTIALLY_PAID` or `PAID`.
- Paid or cancelled receivables cannot receive new payments.
- Cash payments create cash movement records.

## Returns

- Returns are allowed for completed or partially returned sales.
- Cancelled sales and fully returned sales cannot be returned again.
- Return requests cannot contain duplicate sale item ids.
- Return quantity cannot exceed the remaining returnable quantity.
- Returned products are added back to inventory through inventory movement records.
- Cash sale returns generate a cash refund.
- Credit sale returns reduce the adjusted receivable amount. If previous payments exceed the new adjusted amount, the excess becomes a cash refund.
- Sale status becomes `PARTIALLY_RETURNED` or `RETURNED`.

## Sale Cancellation

- Cancellation records a separate cancellation entity; it does not physically delete the sale.
- A sale cannot be cancelled twice.
- Sales with returns cannot be cancelled.
- Credit sales with payments cannot be cancelled.
- Cancellation restores inventory through inventory movement records.
- Cash sale cancellation creates a cash refund movement.
- Credit sale cancellation cancels the related receivable when allowed.
- Cashiers can only cancel sales they are allowed to access; administrators have wider access through role rules.

## Inventory

- Products track current stock and minimum stock.
- Manual inventory entries and exits are restricted to `ADMIN`.
- Manual exits validate available stock.
- Inventory movements preserve previous stock, new stock, direction, type, source type, source id, product, user, and description.
- Stock changes are created by product initial stock, sales, returns, cancellations, supplier opening inventory, supplier entries, and supplier settlement adjustments.
- Backend services own stock calculation. The frontend must not update stock optimistically.

## Suppliers and Merchandise Entries

- Suppliers are managed by `ADMIN`.
- Supplier names must be unique ignoring case.
- Suppliers are deactivated rather than physically deleted.
- Products may be assigned to one primary supplier.
- Supplier merchandise entries require an active supplier and active products that belong to that supplier.
- Entries calculate cost subtotals, sale value subtotals, total cost, and total sale value in the backend.
- Entries update product stock and latest known cost/sale price.
- Historical entries can preserve unknown costs through the `costKnown` flag.
- Entries are historical records and are not edited or deleted through the current workflow.

## Supplier Settlements

Supplier settlements model a merchandise control workflow independent from POS sales.

```text
Amount to account for =
opening inventory value
+ merchandise received value
- final inventory value
```

- The first settlement starts from the supplier opening inventory.
- Later settlements start from the final inventory of the previous finalized settlement.
- The user selects the supplier and period end; the backend determines the period start.
- Only one draft settlement is allowed per supplier.
- Draft settlements can be updated with final physical counts, final prices, delivered amount, and notes.
- Finalized settlements cannot be edited.
- Finalization recalculates totals, requires a delivered amount, requires notes when there is a difference or quantity discrepancy, and updates product stock to the final count.
- Historical imported settlements are marked as imported and preserve snapshots from the source files.
- POS sales are not used to calculate supplier settlement amounts.
- Negative values and inconsistencies can be preserved for historical auditability instead of being silently corrected.

## Reports and Dashboard

- The dashboard returns different data for `ADMIN` and `CASHIER`.
- `ADMIN` receives global daily sales, receivables, low-stock products, open cash sessions, and recent sales.
- `CASHIER` receives their current cash session, current-session sales, and permitted recent sales.
- The daily dashboard range uses the system date and backend report calculations.
- Cancelled operations are excluded from active sale totals according to report repository queries.
