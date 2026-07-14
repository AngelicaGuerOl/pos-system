package com.angelica.pos.sale.exception;

public class SaleAccessDeniedException extends RuntimeException {

    public SaleAccessDeniedException() {
        super("Acceso prohibido");
    }
}
