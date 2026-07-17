package com.angelica.pos.supplier.entry.mapper;

import com.angelica.pos.supplier.entry.dto.SupplierEntryItemResponse;
import com.angelica.pos.supplier.entry.dto.SupplierEntryResponse;
import com.angelica.pos.supplier.entry.entity.SupplierEntry;
import com.angelica.pos.supplier.entry.entity.SupplierEntryItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SupplierEntryMapper {

    @Mapping(target = "supplierId", source = "supplier.id")
    @Mapping(target = "supplierName", source = "supplier.name")
    @Mapping(target = "registeredByUserId", source = "registeredBy.id")
    @Mapping(target = "registeredByUsername", source = "registeredBy.username")
    SupplierEntryResponse toResponse(SupplierEntry entry);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    SupplierEntryItemResponse toItemResponse(SupplierEntryItem item);
}
