package com.angelica.pos.sale.dto;

import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.receivable.entity.ReceivableStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
public class SaleSummaryResponse {

    private Long id;
    private OffsetDateTime createdAt;
    private Long createdById;
    private String createdByUsername;
    private Long customerId;
    private String customerFullName;
    private SaleType saleType;
    private SaleStatus status;
    private BigDecimal total;
    private Long totalItems;
    private SaleReceivableResponse receivable;

    public SaleSummaryResponse(
            Long id,
            OffsetDateTime createdAt,
            Long createdById,
            String createdByUsername,
            Long customerId,
            String customerFullName,
            SaleType saleType,
            SaleStatus status,
            BigDecimal total,
            Long totalItems,
            Long receivableId,
            BigDecimal receivableOriginalAmount,
            BigDecimal receivablePaidAmount,
            BigDecimal receivableOutstandingBalance,
            ReceivableStatus receivableStatus
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.createdById = createdById;
        this.createdByUsername = createdByUsername;
        this.customerId = customerId;
        this.customerFullName = customerFullName;
        this.saleType = saleType;
        this.status = status;
        this.total = total;
        this.totalItems = totalItems;
        if (receivableId != null) {
            this.receivable = new SaleReceivableResponse(
                    receivableId,
                    receivableOriginalAmount,
                    receivablePaidAmount,
                    receivableOutstandingBalance,
                    receivableStatus
            );
        }
    }
}
