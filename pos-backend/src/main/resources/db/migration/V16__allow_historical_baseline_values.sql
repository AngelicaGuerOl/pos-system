ALTER TABLE supplier_inventory_baseline_items
    ADD COLUMN historical_import BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN source_file VARCHAR(255),
    ADD COLUMN source_sheet VARCHAR(120);

ALTER TABLE supplier_inventory_baseline_items
    DROP CONSTRAINT chk_supplier_inventory_baseline_items_inventory_value_math;

ALTER TABLE supplier_inventory_baseline_items
    ADD CONSTRAINT chk_supplier_inventory_baseline_items_inventory_value_math
        CHECK (historical_import OR inventory_value = quantity * sale_price_snapshot);

CREATE INDEX idx_supplier_inventory_baseline_items_historical_import
    ON supplier_inventory_baseline_items (historical_import);
