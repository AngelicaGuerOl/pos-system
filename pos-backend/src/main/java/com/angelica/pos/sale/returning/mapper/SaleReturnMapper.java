package com.angelica.pos.sale.returning.mapper;

import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.sale.returning.dto.SaleReturnDetailResponse;
import com.angelica.pos.sale.returning.dto.SaleReturnItemResponse;
import com.angelica.pos.sale.returning.dto.SaleReturnSummaryResponse;
import com.angelica.pos.sale.returning.entity.SaleReturn;
import com.angelica.pos.sale.returning.entity.SaleReturnItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SaleReturnMapper {

    @Mapping(target = "saleId", source = "sale.id")
    @Mapping(target = "saleNumber", source = "sale.id")
    @Mapping(target = "saleType", source = "sale.saleType")
    @Mapping(target = "cashSessionId", source = "cashSession.id")
    @Mapping(target = "processedByUserId", source = "processedBy.id")
    @Mapping(target = "processedByUsername", source = "processedBy.username")
    SaleReturnSummaryResponse toSummaryResponse(SaleReturn saleReturn);

    @Mapping(target = "saleId", source = "sale.id")
    @Mapping(target = "saleNumber", source = "sale.id")
    @Mapping(target = "saleType", source = "sale.saleType")
    @Mapping(target = "cashSessionId", source = "cashSession.id")
    @Mapping(target = "processedByUserId", source = "processedBy.id")
    @Mapping(target = "processedByUsername", source = "processedBy.username")
    @Mapping(target = "customerId", source = "sale.customer.id")
    @Mapping(target = "customerFullName", expression = "java(toCustomerFullName(saleReturn.getSale().getCustomer()))")
    @Mapping(target = "saleStatus", source = "sale.status")
    @Mapping(target = "receivable", ignore = true)
    SaleReturnDetailResponse toDetailResponse(SaleReturn saleReturn);

    @Mapping(target = "saleItemId", source = "saleItem.id")
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "saleItem.productName")
    @Mapping(target = "productBarcode", source = "saleItem.productBarcode")
    @Mapping(target = "unit", source = "saleItem.productUnit")
    SaleReturnItemResponse toItemResponse(SaleReturnItem item);

    List<SaleReturnSummaryResponse> toSummaryResponseList(List<SaleReturn> saleReturns);

    default String toCustomerFullName(Customer customer) {
        if (customer == null) {
            return null;
        }
        return customer.getFirstName() + " " + customer.getLastName();
    }
}
