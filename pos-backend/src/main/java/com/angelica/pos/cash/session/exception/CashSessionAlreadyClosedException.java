package com.angelica.pos.cash.session.exception;

public class CashSessionAlreadyClosedException extends RuntimeException {

    public CashSessionAlreadyClosedException(Long id) {
        super("La sesion de caja " + id + " ya esta cerrada");
    }
}
