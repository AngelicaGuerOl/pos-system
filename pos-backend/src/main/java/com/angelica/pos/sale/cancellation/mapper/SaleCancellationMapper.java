package com.angelica.pos.sale.cancellation.mapper;

import com.angelica.pos.sale.cancellation.dto.SaleCancellationResponse;
import com.angelica.pos.sale.cancellation.entity.SaleCancellation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SaleCancellationMapper {

    @Mapping(target = "saleId", source = "sale.id")
    @Mapping(target = "saleNumber", source = "sale.id")
    @Mapping(target = "saleType", source = "sale.saleType")
    @Mapping(target = "saleStatus", source = "sale.status")
    @Mapping(target = "cashSessionId", source = "cashSession.id")
    @Mapping(target = "cancelledByUserId", source = "cancelledBy.id")
    @Mapping(target = "cancelledByUsername", source = "cancelledBy.username")
    SaleCancellationResponse toResponse(SaleCancellation cancellation);
}
