package com.angelica.pos.cash.session.mapper;

import com.angelica.pos.cash.session.dto.CashSessionResponse;
import com.angelica.pos.cash.session.entity.CashSession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CashSessionMapper {

    @Mapping(target = "openedByUserId", source = "openedBy.id")
    @Mapping(target = "openedByUsername", source = "openedBy.username")
    @Mapping(target = "closedByUserId", source = "closedBy.id")
    @Mapping(target = "closedByUsername", source = "closedBy.username")
    CashSessionResponse toResponse(CashSession cashSession);

    List<CashSessionResponse> toResponseList(List<CashSession> cashSessions);
}
