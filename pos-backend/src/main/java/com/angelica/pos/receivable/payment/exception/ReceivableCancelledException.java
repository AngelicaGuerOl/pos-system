package com.angelica.pos.receivable.payment.exception;

public class ReceivableCancelledException extends RuntimeException {

    public ReceivableCancelledException(Long receivableId) {
        super("La cuenta por cobrar " + receivableId + " esta cancelada");
    }
}
