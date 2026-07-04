package com.angelica.pos.catalog.product.exception;

public class ProductAlreadyExistsException extends RuntimeException {

    public ProductAlreadyExistsException(String barcode) {
        super("Ya existe un producto con el codigo de barras: " + barcode);
    }
}
