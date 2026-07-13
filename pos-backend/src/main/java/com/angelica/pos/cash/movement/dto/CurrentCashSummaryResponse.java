package com.angelica.pos.cash.movement.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class CurrentCashSummaryResponse {

    private Long sessionId;
    private BigDecimal openingAmount;
    private BigDecimal totalInflows;
    private BigDecimal totalOutflows;
    private BigDecimal expectedCash;
}
