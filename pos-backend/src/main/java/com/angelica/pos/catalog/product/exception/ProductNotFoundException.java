package com.angelica.pos.catalog.product.exception;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(Long id) {
        super("No se encontro un producto activo con id: " + id);
    }

    public ProductNotFoundException(String barcode) {
        super("No se encontro un producto activo con codigo de barras: " + barcode);
    }
}
