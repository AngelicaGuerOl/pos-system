package com.angelica.pos.receivable.mapper;

import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.receivable.dto.ReceivableCustomerResponse;
import com.angelica.pos.receivable.dto.ReceivableDetailResponse;
import com.angelica.pos.receivable.dto.ReceivableSummaryResponse;
import com.angelica.pos.receivable.entity.Receivable;
import com.angelica.pos.sale.dto.SaleReceivableResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ReceivableMapper {

    @Mapping(target = "saleId", source = "sale.id")
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerFullName", expression = "java(toCustomerFullName(receivable.getCustomer()))")
    ReceivableSummaryResponse toSummaryResponse(Receivable receivable);

    @Mapping(target = "saleId", source = "sale.id")
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerFullName", expression = "java(toCustomerFullName(receivable.getCustomer()))")
    @Mapping(target = "folio", source = "sale.id")
    @Mapping(target = "registeredByUserId", source = "sale.createdBy.id")
    @Mapping(target = "registeredByUsername", source = "sale.createdBy.username")
    @Mapping(target = "saleCreatedAt", source = "sale.createdAt")
    @Mapping(target = "customer", source = "customer")
    ReceivableDetailResponse toDetailResponse(Receivable receivable);

    SaleReceivableResponse toSaleReceivableResponse(Receivable receivable);

    @Mapping(target = "fullName", expression = "java(toCustomerFullName(customer))")
    ReceivableCustomerResponse toCustomerResponse(Customer customer);

    List<ReceivableSummaryResponse> toSummaryResponseList(List<Receivable> receivables);

    default String toCustomerFullName(Customer customer) {
        if (customer == null) {
            return null;
        }
        return customer.getFirstName() + " " + customer.getLastName();
    }
}
