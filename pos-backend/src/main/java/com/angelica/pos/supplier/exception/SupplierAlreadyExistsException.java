package com.angelica.pos.supplier.exception;

public class SupplierAlreadyExistsException extends RuntimeException {

    public SupplierAlreadyExistsException(String name) {
        super("Ya existe un proveedor con el nombre: " + name);
    }
}
