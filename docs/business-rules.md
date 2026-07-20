# Business Rules

This document summarizes rules implemented by the backend. For exact HTTP contracts, use Swagger UI with the `dev` profile.

## Users And Authentication

- Only active users can authenticate.
- The real roles are `ADMIN` and `CASHIER`.
- JWTs include username, id, role, issued-at time, and expiration.
- Users with `mustChangePassword` must change their password before using business endpoints.
- User management is restricted to `ADMIN`.
- The user service prevents leaving the system without active administrators.

## Cash

- A user can have only one open cash session.
- Opening a cash session requires an initial amount.
- Cash sales, payments, manual movements, returns with refunds, and cancellations with refunds are linked to a cash session.
- Expected cash is calculated as initial amount plus inflows minus outflows.
- Closing stores a snapshot of totals, counted cash, difference, notes, user, and timestamp.
- Closed cash sessions cannot receive new operations.

## Sales

- A sale must have at least one item.
- Quantities must be positive.
- The backend calculates totals.
- Products are locked before stock is validated and updated.
- Items store historical snapshots of product, barcode, unit, price, and cost.
- Cash sales require an open cash session and enough cash received.
- Credit sales require a customer and do not accept cash received.
- `ADMIN` can query global history; `CASHIER` has access limited by security and service rules.

## Accounts Receivable

- A credit sale creates an account receivable.
- A receivable stores original amount, returned amount, adjusted amount, paid amount, outstanding balance, status, and payment date.
- A payment requires an open cash session.
- A payment cannot exceed the outstanding balance.
- Paid or cancelled receivables do not accept new payments.
- Cash payments generate cash movements.

## Returns

- Returns are allowed for completed or partially returned sales.
- Cancelled or fully returned sales do not accept new returns.
- Duplicate items are not allowed in the same request.
- Returned quantity cannot exceed the remaining returnable quantity.
- Returned products go back into inventory.
- Cash sales generate a cash refund.
- Credit sales reduce the adjusted receivable amount; if previous payments exceed the new amount, a cash refund may be generated.
- Sale status changes to `PARTIALLY_RETURNED` or `RETURNED`.

## Cancellations

- Cancellation creates its own entity; it does not delete the sale.
- A sale cannot be cancelled twice.
- Sales with returns cannot be cancelled.
- Credit sales with payments cannot be cancelled.
- Cancellation restores inventory.
- Cancelled cash sales generate a cash refund outflow.
- Cancelled credit sales cancel the receivable when allowed.
- Cashiers can only cancel sales they can access; administrators have broader access.

## Inventory

- `products.current_stock` stores current stock.
- Manual inventory movements require `ADMIN`.
- Manual exits validate available stock.
- Each movement stores product, user, direction, type, quantity, previous stock, new stock, source, and description.
- Stock changes through sales, returns, cancellations, manual entries/exits, opening inventory, merchandise received, and supplier settlements.

## Suppliers And Merchandise

- Suppliers are managed by `ADMIN`.
- Supplier names are unique case-insensitively.
- Suppliers are deactivated, not physically deleted.
- Products can be assigned to a primary supplier.
- Merchandise entries require an active supplier and active products from that supplier.
- The backend calculates subtotals, costs, and sale values.
- Entries update stock and known prices.
- Historical entries can preserve unknown costs through `costKnown`.

## Supplier Settlements

Formula:

```text
Amount to justify =
opening inventory
+ merchandise received
- final inventory
```

- The first settlement starts from supplier opening inventory.
- Later settlements start from the final inventory of the latest finalized settlement.
- Only one draft can exist per supplier.
- Drafts can update final inventory, prices, delivered amount, and notes.
- Finalized settlements cannot be edited.
- Finalization recalculates totals, requires delivered amount, and may require notes when differences exist.
- Finalization adjusts stock through inventory movements.
- Imported historical records preserve source snapshots.
- POS sales are not used to calculate the supplier settlement amount.

## Reports And Dashboard

- Dashboard data depends on role.
- `ADMIN` sees global summary, sales, accounts receivable, low stock, open cash sessions, and recent sales.
- `CASHIER` sees information focused on their own operation.
- Administrative reports are restricted to `ADMIN`.
