package com.angelica.pos.sale.exception;

public class CreditSaleCustomerRequiredException extends RuntimeException {

    public CreditSaleCustomerRequiredException() {
        super("El cliente es obligatorio para una venta fiada");
    }
}
