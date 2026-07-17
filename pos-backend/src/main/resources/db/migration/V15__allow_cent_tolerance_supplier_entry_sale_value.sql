ALTER TABLE supplier_entry_items
    DROP CONSTRAINT chk_supplier_entry_items_sale_value_math;

ALTER TABLE supplier_entry_items
    ADD CONSTRAINT chk_supplier_entry_items_sale_value_math
        CHECK (ABS(sale_value_subtotal - (quantity * sale_price)) <= 0.01);
