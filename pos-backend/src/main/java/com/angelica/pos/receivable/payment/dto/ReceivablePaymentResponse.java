package com.angelica.pos.receivable.payment.dto;

import com.angelica.pos.receivable.entity.ReceivableStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
public class ReceivablePaymentResponse {

    private Long id;
    private Long receivableId;
    private Long saleId;
    private Long customerId;
    private String customerFullName;
    private Long cashSessionId;
    private Long receivedById;
    private String receivedByUsername;
    private BigDecimal amount;
    private String notes;
    private OffsetDateTime createdAt;
    private BigDecimal paidAmount;
    private BigDecimal outstandingBalance;
    private ReceivableStatus receivableStatus;
}
