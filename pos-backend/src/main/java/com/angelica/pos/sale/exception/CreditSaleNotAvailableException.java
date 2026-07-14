package com.angelica.pos.sale.exception;

public class CreditSaleNotAvailableException extends RuntimeException {

    public CreditSaleNotAvailableException() {
        super("La venta fiada no esta disponible en esta fase");
    }
}
