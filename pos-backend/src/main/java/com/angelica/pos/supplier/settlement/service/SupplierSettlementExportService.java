package com.angelica.pos.supplier.settlement.service;

public interface SupplierSettlementExportService {

    ExportedSettlement export(Long id);

    record ExportedSettlement(String filename, byte[] content) {
    }
}
