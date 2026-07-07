package com.angelica.pos.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerUpdateRequest {

    @NotBlank(message = "El nombre del cliente es obligatorio")
    @Size(max = 80, message = "El nombre no debe superar los 80 caracteres")
    private String firstName;

    @NotBlank(message = "El apellido del cliente es obligatorio")
    @Size(max = 100, message = "El apellido no debe superar los 100 caracteres")
    private String lastName;

    @Size(max = 20, message = "El telefono no debe superar los 20 caracteres")
    private String phone;
}
