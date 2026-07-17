package com.angelica.pos.supplier.settlement.exception;

public class SupplierSettlementDraftAlreadyExistsException extends RuntimeException {
    public SupplierSettlementDraftAlreadyExistsException(Long supplierId) {
        super("Ya existe un corte borrador para el proveedor: " + supplierId);
    }
}
