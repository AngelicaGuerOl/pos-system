package com.angelica.pos.supplier.service;

import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.supplier.dto.SupplierInventoryBaselineRequest;
import com.angelica.pos.supplier.dto.SupplierInventoryBaselineResponse;

public interface SupplierInventoryBaselineService {

    SupplierInventoryBaselineResponse create(
            Long supplierId,
            SupplierInventoryBaselineRequest request,
            AuthenticatedUser authenticatedUser
    );

    SupplierInventoryBaselineResponse findBySupplier(Long supplierId);
}
