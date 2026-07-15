package com.angelica.pos.sale.cancellation.service;

import com.angelica.pos.sale.cancellation.dto.SaleCancellationRequest;
import com.angelica.pos.sale.cancellation.dto.SaleCancellationResponse;
import com.angelica.pos.security.AuthenticatedUser;

public interface SaleCancellationService {

    SaleCancellationResponse cancel(
            Long saleId,
            SaleCancellationRequest request,
            AuthenticatedUser authenticatedUser
    );
}
