package com.angelica.pos.sale.cancellation.dto;

import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
public class SaleCancellationResponse {

    private Long id;
    private Long saleId;
    private Long saleNumber;
    private SaleType saleType;
    private SaleStatus saleStatus;
    private String reason;
    private BigDecimal refundAmount;
    private Long cashSessionId;
    private Long cancelledByUserId;
    private String cancelledByUsername;
    private OffsetDateTime createdAt;
}
