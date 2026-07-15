package com.angelica.pos.sale.returning.exception;

public class DuplicateSaleReturnItemException extends RuntimeException {

    public DuplicateSaleReturnItemException(Long saleItemId) {
        super("Duplicate sale item in return request: " + saleItemId);
    }
}
