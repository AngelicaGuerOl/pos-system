package com.angelica.pos.sale.returning.exception;

public class SaleItemDoesNotBelongToSaleException extends RuntimeException {

    public SaleItemDoesNotBelongToSaleException(Long saleItemId, Long saleId) {
        super("Sale item " + saleItemId + " does not belong to sale " + saleId);
    }
}
