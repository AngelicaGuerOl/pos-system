package com.angelica.pos.receivable.payment.exception;

public class ReceivablePaymentNotFoundException extends RuntimeException {

    public ReceivablePaymentNotFoundException(Long id) {
        super("Abono no encontrado con id " + id);
    }
}
