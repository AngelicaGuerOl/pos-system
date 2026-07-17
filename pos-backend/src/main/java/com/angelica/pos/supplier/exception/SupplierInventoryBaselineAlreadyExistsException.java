package com.angelica.pos.supplier.exception;

public class SupplierInventoryBaselineAlreadyExistsException extends RuntimeException {

    public SupplierInventoryBaselineAlreadyExistsException(Long supplierId) {
        super("El proveedor ya tiene inventario inicial registrado: " + supplierId);
    }
}
