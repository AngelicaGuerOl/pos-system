package com.angelica.pos.receivable.payment.exception;

import java.math.BigDecimal;

public class ReceivablePaymentExceedsBalanceException extends RuntimeException {

    public ReceivablePaymentExceedsBalanceException(BigDecimal outstandingBalance, BigDecimal amount) {
        super("El abono no puede superar el saldo pendiente. Saldo: " + outstandingBalance + ", abono: " + amount);
    }
}
