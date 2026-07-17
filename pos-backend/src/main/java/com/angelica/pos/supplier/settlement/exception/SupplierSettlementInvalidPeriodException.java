package com.angelica.pos.supplier.settlement.exception;

public class SupplierSettlementInvalidPeriodException extends RuntimeException {
    public SupplierSettlementInvalidPeriodException() {
        super("El periodo del corte no es valido");
    }
}
