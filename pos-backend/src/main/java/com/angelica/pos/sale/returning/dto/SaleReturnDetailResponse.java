package com.angelica.pos.sale.returning.dto;

import com.angelica.pos.sale.dto.SaleReceivableResponse;
import com.angelica.pos.sale.entity.SaleStatus;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SaleReturnDetailResponse extends SaleReturnSummaryResponse {

    private Long customerId;
    private String customerFullName;
    private SaleStatus saleStatus;
    private SaleReceivableResponse receivable;
    private List<SaleReturnItemResponse> items;
}
