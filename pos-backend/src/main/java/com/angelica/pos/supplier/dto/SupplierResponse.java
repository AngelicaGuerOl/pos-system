package com.angelica.pos.supplier.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
public class SupplierResponse {

    private Long id;
    private String name;
    private String contactName;
    private String phone;
    private String email;
    private String notes;
    private Boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
