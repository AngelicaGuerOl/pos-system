package com.angelica.pos.sale.returning.exception;

public class CreditSaleReceivableRequiredException extends RuntimeException {

    public CreditSaleReceivableRequiredException(Long saleId) {
        super("Receivable is required for credit sale: " + saleId);
    }
}
