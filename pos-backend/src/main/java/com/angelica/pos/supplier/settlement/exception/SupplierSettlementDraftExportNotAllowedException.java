package com.angelica.pos.supplier.settlement.exception;

public class SupplierSettlementDraftExportNotAllowedException extends RuntimeException {
    public SupplierSettlementDraftExportNotAllowedException(Long id) {
        super("Solo se pueden exportar cortes finalizados: " + id);
    }
}
