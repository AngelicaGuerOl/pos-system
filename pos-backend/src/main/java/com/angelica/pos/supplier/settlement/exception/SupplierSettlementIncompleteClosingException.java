package com.angelica.pos.supplier.settlement.exception;

public class SupplierSettlementIncompleteClosingException extends RuntimeException {
    public SupplierSettlementIncompleteClosingException() {
        super("Deben capturarse todos los conteos finales del corte");
    }
}
