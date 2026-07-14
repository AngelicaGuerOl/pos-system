package com.angelica.pos.sale.mapper;

import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.receivable.mapper.ReceivableMapper;
import com.angelica.pos.sale.dto.SaleDetailResponse;
import com.angelica.pos.sale.dto.SaleItemResponse;
import com.angelica.pos.sale.dto.SaleResponse;
import com.angelica.pos.sale.entity.Sale;
import com.angelica.pos.sale.entity.SaleItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = ReceivableMapper.class)
public interface SaleMapper {

    @Mapping(target = "cashSessionId", source = "cashSession.id")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByUsername", source = "createdBy.username")
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerFullName", expression = "java(toCustomerFullName(sale.getCustomer()))")
    SaleResponse toResponse(Sale sale);

    @Mapping(target = "cashSessionId", source = "cashSession.id")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByUsername", source = "createdBy.username")
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerFullName", expression = "java(toCustomerFullName(sale.getCustomer()))")
    SaleDetailResponse toDetailResponse(Sale sale);

    @Mapping(target = "productId", source = "product.id")
    SaleItemResponse toItemResponse(SaleItem saleItem);

    List<SaleResponse> toResponseList(List<Sale> sales);

    default String toCustomerFullName(Customer customer) {
        if (customer == null) {
            return null;
        }
        return customer.getFirstName() + " " + customer.getLastName();
    }
}
