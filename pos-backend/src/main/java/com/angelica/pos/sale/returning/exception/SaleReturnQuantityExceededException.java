package com.angelica.pos.sale.returning.exception;

import java.math.BigDecimal;

public class SaleReturnQuantityExceededException extends RuntimeException {

    public SaleReturnQuantityExceededException(Long saleItemId, BigDecimal requested, BigDecimal available) {
        super("No se puede devolver " + requested + " del articulo " + saleItemId
                + ". Cantidad disponible para devolucion: " + available + ".");
    }
}
