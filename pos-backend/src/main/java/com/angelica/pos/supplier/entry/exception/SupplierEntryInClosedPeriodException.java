package com.angelica.pos.supplier.entry.exception;

public class SupplierEntryInClosedPeriodException extends RuntimeException {

    public SupplierEntryInClosedPeriodException() {
        super("No se puede registrar una entrada en un periodo de corte finalizado");
    }
}
