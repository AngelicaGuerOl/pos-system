package com.angelica.pos.receivable.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
public class ReceivableDetailResponse extends ReceivableSummaryResponse {

    private Long folio;
    private Long registeredByUserId;
    private String registeredByUsername;
    private OffsetDateTime saleCreatedAt;
    private ReceivableCustomerResponse customer;
}
