package com.angelica.pos.sale.dto;

import com.angelica.pos.receivable.entity.ReceivableStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SaleReceivableResponse {

    private Long id;
    private BigDecimal originalAmount;
    private BigDecimal paidAmount;
    private BigDecimal outstandingBalance;
    private ReceivableStatus status;
}
