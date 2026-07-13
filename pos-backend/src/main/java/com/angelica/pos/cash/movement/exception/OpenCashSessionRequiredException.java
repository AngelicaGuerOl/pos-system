package com.angelica.pos.cash.movement.exception;

public class OpenCashSessionRequiredException extends RuntimeException {

    public OpenCashSessionRequiredException() {
        super("No existe una sesion de caja abierta para el usuario");
    }
}
