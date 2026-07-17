ALTER TABLE supplier_entry_items
    ALTER COLUMN unit_cost TYPE NUMERIC(12, 4);

ALTER TABLE supplier_entry_items
    DROP CONSTRAINT chk_supplier_entry_items_cost_math;

ALTER TABLE supplier_entry_items
    ADD CONSTRAINT chk_supplier_entry_items_cost_math
        CHECK (ABS(cost_subtotal - (quantity * unit_cost)) <= 0.01);
