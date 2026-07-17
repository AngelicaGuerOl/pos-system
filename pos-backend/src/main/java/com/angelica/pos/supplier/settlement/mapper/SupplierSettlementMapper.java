package com.angelica.pos.supplier.settlement.mapper;

import com.angelica.pos.supplier.settlement.dto.SupplierSettlementItemResponse;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementResponse;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlement;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SupplierSettlementMapper {

    @Mapping(target = "supplierId", source = "supplier.id")
    @Mapping(target = "supplierName", source = "supplier.name")
    @Mapping(target = "createdByUserId", source = "createdBy.id")
    @Mapping(target = "createdByUsername", source = "createdBy.username")
    @Mapping(target = "finalizedByUserId", source = "finalizedBy.id")
    @Mapping(target = "finalizedByUsername", source = "finalizedBy.username")
    SupplierSettlementResponse toResponse(SupplierSettlement settlement);

    @Mapping(target = "productId", source = "product.id")
    SupplierSettlementItemResponse toItemResponse(SupplierSettlementItem item);
}
