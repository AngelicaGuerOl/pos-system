package com.angelica.pos.receivable.exception;

public class ReceivableNotFoundException extends RuntimeException {

    public ReceivableNotFoundException(Long id) {
        super("Cuenta por cobrar no encontrada con id " + id);
    }
}
