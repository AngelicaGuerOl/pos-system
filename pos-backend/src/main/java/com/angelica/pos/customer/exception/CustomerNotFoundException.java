package com.angelica.pos.customer.exception;

public class CustomerNotFoundException extends RuntimeException {

    public CustomerNotFoundException(Long id) {
        super("No se encontro un cliente activo con id: " + id);
    }
}
