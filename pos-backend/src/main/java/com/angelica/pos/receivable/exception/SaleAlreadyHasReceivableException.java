package com.angelica.pos.receivable.exception;

public class SaleAlreadyHasReceivableException extends RuntimeException {

    public SaleAlreadyHasReceivableException(Long saleId) {
        super("La venta " + saleId + " ya tiene una cuenta por cobrar asociada");
    }
}
