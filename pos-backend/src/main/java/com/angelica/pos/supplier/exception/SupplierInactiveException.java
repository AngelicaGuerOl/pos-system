package com.angelica.pos.supplier.exception;

public class SupplierInactiveException extends RuntimeException {

    public SupplierInactiveException(Long id) {
        super("El proveedor esta inactivo: " + id);
    }
}
