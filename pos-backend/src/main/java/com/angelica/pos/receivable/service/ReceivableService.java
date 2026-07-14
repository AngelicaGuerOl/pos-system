package com.angelica.pos.receivable.service;

import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.receivable.dto.ReceivableDetailResponse;
import com.angelica.pos.receivable.dto.ReceivableSummaryResponse;
import com.angelica.pos.receivable.entity.Receivable;
import com.angelica.pos.receivable.entity.ReceivableStatus;
import com.angelica.pos.sale.entity.Sale;
import com.angelica.pos.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;

public interface ReceivableService {

    Receivable createForCreditSale(Sale sale, Customer customer);

    PageResponse<ReceivableSummaryResponse> findAll(
            Long customerId,
            Long saleId,
            ReceivableStatus status,
            OffsetDateTime from,
            OffsetDateTime to,
            Pageable pageable
    );

    ReceivableDetailResponse findById(Long id);

    PageResponse<ReceivableSummaryResponse> findByCustomer(
            Long customerId,
            ReceivableStatus status,
            Pageable pageable
    );
}
