package com.angelica.pos.sale.dto;

import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
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
}
