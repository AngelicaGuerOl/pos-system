package com.angelica.pos.cash.session.exception;

public class CashSessionNotFoundException extends RuntimeException {

    public CashSessionNotFoundException(Long id) {
        super("Sesion de caja no encontrada: " + id);
    }
}
