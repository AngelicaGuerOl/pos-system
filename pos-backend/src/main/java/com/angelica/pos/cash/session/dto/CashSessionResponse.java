package com.angelica.pos.cash.session.dto;

import com.angelica.pos.cash.session.entity.CashSessionStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
public class CashSessionResponse {

    private Long id;
    private Long openedByUserId;
    private String openedByUsername;
    private BigDecimal openingAmount;
    private OffsetDateTime openedAt;
    private CashSessionStatus status;
    private Long closedByUserId;
    private String closedByUsername;
    private OffsetDateTime closedAt;
    private BigDecimal expectedCash;
    private BigDecimal countedCash;
    private BigDecimal cashDifference;
}
