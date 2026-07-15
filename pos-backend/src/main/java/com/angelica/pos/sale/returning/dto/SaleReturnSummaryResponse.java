package com.angelica.pos.sale.returning.dto;

import com.angelica.pos.sale.entity.SaleType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
public class SaleReturnSummaryResponse {

    private Long id;
    private Long saleId;
    private Long saleNumber;
    private SaleType saleType;
    private BigDecimal totalAmount;
    private BigDecimal cashRefundAmount;
    private String reason;
    private Long cashSessionId;
    private Long processedByUserId;
    private String processedByUsername;
    private OffsetDateTime createdAt;
}
