package com.angelica.pos.supplier.settlement.exception;

public class SupplierSettlementInvalidDeliveredAmountException extends RuntimeException {
    public SupplierSettlementInvalidDeliveredAmountException() {
        super("El importe entregado es obligatorio y debe ser mayor o igual a cero");
    }
}
