package com.angelica.pos.catalog.product.service;

import com.angelica.pos.catalog.product.dto.BarcodeLookupResponse;

public interface BarcodeLookupService {

    BarcodeLookupResponse lookup(String barcode);
}
