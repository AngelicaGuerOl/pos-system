package com.angelica.pos.receivable.dto;

import com.angelica.pos.receivable.entity.ReceivableStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReceivableSummaryResponse {

    private Long id;
    private Long saleId;
    private Long customerId;
    private String customerFullName;
    private BigDecimal originalAmount;
    private BigDecimal paidAmount;
    private BigDecimal outstandingBalance;
    private ReceivableStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime paidAt;
}
