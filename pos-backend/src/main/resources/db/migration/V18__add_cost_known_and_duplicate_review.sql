ALTER TABLE products
    ADD COLUMN cost_price_known BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE products
SET cost_price_known = FALSE
WHERE barcode LIKE 'HIST-%'
  AND cost_price = 0;

ALTER TABLE supplier_entry_items
    ADD COLUMN cost_known BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE supplier_entry_items sei
SET cost_known = FALSE
FROM supplier_entries se, products p
WHERE se.id = sei.supplier_entry_id
  AND p.id = sei.product_id
  AND se.historical_import = TRUE
  AND p.barcode LIKE 'HIST-%'
  AND sei.unit_cost = 0
  AND sei.cost_subtotal = 0;
