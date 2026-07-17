package com.angelica.pos.supplier.entry.exception;

public class SupplierEntryNotFoundException extends RuntimeException {

    public SupplierEntryNotFoundException(Long id) {
        super("Entrada de proveedor no encontrada: " + id);
    }
}
