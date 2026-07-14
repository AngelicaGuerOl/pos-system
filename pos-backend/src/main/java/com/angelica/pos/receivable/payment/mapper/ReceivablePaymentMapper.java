package com.angelica.pos.receivable.payment.mapper;

import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.receivable.payment.dto.ReceivablePaymentResponse;
import com.angelica.pos.receivable.payment.entity.ReceivablePayment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ReceivablePaymentMapper {

    @Mapping(target = "receivableId", source = "receivable.id")
    @Mapping(target = "saleId", source = "receivable.sale.id")
    @Mapping(target = "customerId", source = "receivable.customer.id")
    @Mapping(target = "customerFullName", expression = "java(toCustomerFullName(payment.getReceivable().getCustomer()))")
    @Mapping(target = "cashSessionId", source = "cashSession.id")
    @Mapping(target = "receivedById", source = "receivedBy.id")
    @Mapping(target = "receivedByUsername", source = "receivedBy.username")
    @Mapping(target = "paidAmount", source = "receivable.paidAmount")
    @Mapping(target = "outstandingBalance", source = "receivable.outstandingBalance")
    @Mapping(target = "receivableStatus", source = "receivable.status")
    ReceivablePaymentResponse toResponse(ReceivablePayment payment);

    List<ReceivablePaymentResponse> toResponseList(List<ReceivablePayment> payments);

    default String toCustomerFullName(Customer customer) {
        if (customer == null) {
            return null;
        }
        return customer.getFirstName() + " " + customer.getLastName();
    }
}
