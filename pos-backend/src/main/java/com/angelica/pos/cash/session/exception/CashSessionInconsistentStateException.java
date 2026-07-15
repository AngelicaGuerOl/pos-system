package com.angelica.pos.cash.session.exception;

public class CashSessionInconsistentStateException extends RuntimeException {

    public CashSessionInconsistentStateException(Long id) {
        super("La sesion de caja " + id + " tiene un estado inconsistente");
    }
}
