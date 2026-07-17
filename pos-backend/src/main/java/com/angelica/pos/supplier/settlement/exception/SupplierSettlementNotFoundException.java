package com.angelica.pos.supplier.settlement.exception;

public class SupplierSettlementNotFoundException extends RuntimeException {
    public SupplierSettlementNotFoundException(Long id) {
        super("Corte de proveedor no encontrado: " + id);
    }
}
