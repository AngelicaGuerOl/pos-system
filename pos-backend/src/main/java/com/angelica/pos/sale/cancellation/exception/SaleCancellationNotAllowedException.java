package com.angelica.pos.sale.cancellation.exception;

public class SaleCancellationNotAllowedException extends RuntimeException {

    public SaleCancellationNotAllowedException(String message) {
        super(message);
    }
}
