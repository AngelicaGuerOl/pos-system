package com.angelica.pos.supplier.settlement.exception;

public class SupplierSettlementAlreadyFinalizedException extends RuntimeException {
    public SupplierSettlementAlreadyFinalizedException(Long id) {
        super("El corte ya esta finalizado: " + id);
    }
}
