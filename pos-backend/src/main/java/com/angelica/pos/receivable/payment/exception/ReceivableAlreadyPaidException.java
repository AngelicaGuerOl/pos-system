package com.angelica.pos.receivable.payment.exception;

public class ReceivableAlreadyPaidException extends RuntimeException {

    public ReceivableAlreadyPaidException(Long receivableId) {
        super("La cuenta por cobrar " + receivableId + " ya esta pagada");
    }
}
