package com.angelica.pos.supplier.exception;

public class SupplierNotFoundException extends RuntimeException {

    public SupplierNotFoundException(Long id) {
        super("Proveedor no encontrado: " + id);
    }
}
