package com.angelica.pos.supplier.exception;

public class ProductSupplierMismatchException extends RuntimeException {

    public ProductSupplierMismatchException(Long productId, Long supplierId) {
        super("El producto " + productId + " no pertenece al proveedor " + supplierId);
    }
}
