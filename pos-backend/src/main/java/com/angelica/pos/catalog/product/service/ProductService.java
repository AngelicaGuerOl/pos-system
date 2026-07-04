package com.angelica.pos.catalog.product.service;

import com.angelica.pos.catalog.product.dto.ProductRequest;
import com.angelica.pos.catalog.product.dto.ProductResponse;
import com.angelica.pos.catalog.product.dto.ProductUpdateRequest;
import com.angelica.pos.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    ProductResponse create(ProductRequest request);

    PageResponse<ProductResponse> findAllActive(String search, Long categoryId, Boolean lowStock, Pageable pageable);

    ProductResponse findById(Long id);

    ProductResponse findByBarcode(String barcode);

    ProductResponse update(Long id, ProductUpdateRequest request);

    void deactivate(Long id);
}
