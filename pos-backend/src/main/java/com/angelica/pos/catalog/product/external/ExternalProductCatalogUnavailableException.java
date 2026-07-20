package com.angelica.pos.catalog.product.external;

public class ExternalProductCatalogUnavailableException extends RuntimeException {

    public ExternalProductCatalogUnavailableException() {
        super("No fue posible consultar el catalogo externo");
    }
}
