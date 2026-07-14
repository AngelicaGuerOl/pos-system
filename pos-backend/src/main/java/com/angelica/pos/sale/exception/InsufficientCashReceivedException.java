package com.angelica.pos.sale.exception;

import java.math.BigDecimal;

public class InsufficientCashReceivedException extends RuntimeException {

    public InsufficientCashReceivedException(BigDecimal total, BigDecimal cashReceived) {
        super("El efectivo recibido " + cashReceived + " no cubre el total " + total);
    }
}
