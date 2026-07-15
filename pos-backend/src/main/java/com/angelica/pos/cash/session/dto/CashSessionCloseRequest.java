package com.angelica.pos.cash.session.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CashSessionCloseRequest {

    private BigDecimal countedAmount;
    private String notes;
}
