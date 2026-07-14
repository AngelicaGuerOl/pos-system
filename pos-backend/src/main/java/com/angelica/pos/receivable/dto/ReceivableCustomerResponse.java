package com.angelica.pos.receivable.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReceivableCustomerResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
}
