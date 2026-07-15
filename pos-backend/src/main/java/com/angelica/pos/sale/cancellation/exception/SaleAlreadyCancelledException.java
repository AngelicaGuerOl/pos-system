package com.angelica.pos.sale.cancellation.exception;

public class SaleAlreadyCancelledException extends RuntimeException {

    public SaleAlreadyCancelledException(Long saleId) {
        super("La venta " + saleId + " ya fue cancelada");
    }
}
