package com.angelica.pos.cash.movement.mapper;

import com.angelica.pos.cash.movement.dto.CashMovementResponse;
import com.angelica.pos.cash.movement.dto.ManualCashMovementRequest;
import com.angelica.pos.cash.movement.entity.CashMovement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CashMovementMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cashSession", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "direction", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "sourceType", ignore = true)
    @Mapping(target = "sourceId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    CashMovement toEntity(ManualCashMovementRequest request);

    @Mapping(target = "cashSessionId", source = "cashSession.id")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByUsername", source = "createdBy.username")
    CashMovementResponse toResponse(CashMovement cashMovement);

    List<CashMovementResponse> toResponseList(List<CashMovement> cashMovements);
}
