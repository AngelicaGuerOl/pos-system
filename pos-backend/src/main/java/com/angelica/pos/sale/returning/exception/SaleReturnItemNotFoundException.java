package com.angelica.pos.sale.returning.exception;

public class SaleReturnItemNotFoundException extends RuntimeException {

    public SaleReturnItemNotFoundException(Long id) {
        super("Sale item not found with id: " + id);
    }
}
