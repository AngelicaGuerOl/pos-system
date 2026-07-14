package com.angelica.pos.sale.dto;

import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
public class SaleResponse {

    private Long id;
    private Long cashSessionId;
    private Long createdById;
    private String createdByUsername;
    private Long customerId;
    private String customerFullName;
    private SaleType saleType;
    private SaleStatus status;
    private BigDecimal total;
    private BigDecimal cashReceived;
    private BigDecimal changeAmount;
    private OffsetDateTime createdAt;
    private SaleReceivableResponse receivable;
    private List<SaleItemResponse> items;
}
