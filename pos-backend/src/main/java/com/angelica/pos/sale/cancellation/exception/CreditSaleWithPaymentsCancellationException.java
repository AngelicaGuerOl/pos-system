package com.angelica.pos.sale.cancellation.exception;

public class CreditSaleWithPaymentsCancellationException extends RuntimeException {

    public CreditSaleWithPaymentsCancellationException(Long saleId) {
        super("La venta fiada " + saleId + " tiene abonos registrados. Debe realizarse una devolucion total.");
    }
}
