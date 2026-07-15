package com.angelica.pos.sale.returning.exception;

public class SaleReturnNotFoundException extends RuntimeException {

    public SaleReturnNotFoundException(Long id) {
        super("Sale return not found with id: " + id);
    }
}
