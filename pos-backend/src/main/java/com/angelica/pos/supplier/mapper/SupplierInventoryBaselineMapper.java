package com.angelica.pos.supplier.mapper;

import com.angelica.pos.supplier.dto.SupplierInventoryBaselineItemResponse;
import com.angelica.pos.supplier.dto.SupplierInventoryBaselineResponse;
import com.angelica.pos.supplier.entity.SupplierInventoryBaseline;
import com.angelica.pos.supplier.entity.SupplierInventoryBaselineItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SupplierInventoryBaselineMapper {

    @Mapping(target = "supplierId", source = "supplier.id")
    @Mapping(target = "supplierName", source = "supplier.name")
    @Mapping(target = "createdByUserId", source = "createdBy.id")
    @Mapping(target = "createdByUsername", source = "createdBy.username")
    SupplierInventoryBaselineResponse toResponse(SupplierInventoryBaseline baseline);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    SupplierInventoryBaselineItemResponse toItemResponse(SupplierInventoryBaselineItem item);

    List<SupplierInventoryBaselineItemResponse> toItemResponseList(List<SupplierInventoryBaselineItem> items);
}
