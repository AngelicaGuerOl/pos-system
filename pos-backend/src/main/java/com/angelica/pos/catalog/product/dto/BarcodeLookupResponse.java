package com.angelica.pos.catalog.product.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BarcodeLookupResponse {

    private BarcodeLookupStatus status;
    private String barcode;
    private Long existingProductId;
    private Boolean existingProductActive;
    private ProductResponse existingProduct;
    private String suggestedName;
    private String brand;
    private String presentation;
    private String source;
}
