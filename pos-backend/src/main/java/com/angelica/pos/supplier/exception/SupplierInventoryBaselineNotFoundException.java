package com.angelica.pos.supplier.exception;

public class SupplierInventoryBaselineNotFoundException extends RuntimeException {

    public SupplierInventoryBaselineNotFoundException(Long supplierId) {
        super("El proveedor no tiene inventario inicial registrado: " + supplierId);
    }
}
