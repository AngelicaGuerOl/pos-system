package com.angelica.pos.customer.exception;

public class CustomerHasPendingReceivablesException extends RuntimeException {

    public CustomerHasPendingReceivablesException(Long customerId) {
        super("No se puede desactivar el cliente " + customerId + " porque tiene saldo pendiente");
    }
}
