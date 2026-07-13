package com.angelica.pos.cash.session.exception;

public class CashSessionAlreadyOpenException extends RuntimeException {

    public CashSessionAlreadyOpenException(Long userId) {
        super("El usuario ya tiene una sesion de caja abierta: " + userId);
    }
}
