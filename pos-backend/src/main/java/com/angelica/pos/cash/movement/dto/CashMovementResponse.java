package com.angelica.pos.cash.movement.dto;

import com.angelica.pos.cash.movement.entity.CashMovementDirection;
import com.angelica.pos.cash.movement.entity.CashMovementType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
public class CashMovementResponse {

    private Long id;
    private Long cashSessionId;
    private Long createdById;
    private String createdByUsername;
    private CashMovementDirection direction;
    private CashMovementType type;
    private BigDecimal amount;
    private String description;
    private String sourceType;
    private Long sourceId;
    private OffsetDateTime createdAt;
}
