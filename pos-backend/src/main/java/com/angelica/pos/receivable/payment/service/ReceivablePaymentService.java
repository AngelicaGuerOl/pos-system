package com.angelica.pos.receivable.payment.service;

import com.angelica.pos.receivable.payment.dto.ReceivablePaymentRequest;
import com.angelica.pos.receivable.payment.dto.ReceivablePaymentResponse;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface ReceivablePaymentService {

    ReceivablePaymentResponse create(
            Long receivableId,
            ReceivablePaymentRequest request,
            AuthenticatedUser authenticatedUser
    );

    PageResponse<ReceivablePaymentResponse> findByReceivable(Long receivableId, Pageable pageable);

    ReceivablePaymentResponse findById(Long id);
}
