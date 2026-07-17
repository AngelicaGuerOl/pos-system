package com.angelica.pos.supplier.settlement.exception;

public class SupplierSettlementNotesRequiredException extends RuntimeException {
    public SupplierSettlementNotesRequiredException() {
        super("Las observaciones son obligatorias cuando hay diferencias o inconsistencias");
    }
}
