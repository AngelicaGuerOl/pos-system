package com.angelica.pos.sale.exception;

public class CreditSaleCashReceivedNotAllowedException extends RuntimeException {

    public CreditSaleCashReceivedNotAllowedException() {
        super("El efectivo recibido debe ser null para una venta fiada");
    }
}
