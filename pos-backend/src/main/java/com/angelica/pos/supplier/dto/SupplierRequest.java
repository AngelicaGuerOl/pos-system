package com.angelica.pos.supplier.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SupplierRequest {

    @NotBlank(message = "El nombre del proveedor es obligatorio")
    @Size(max = 150, message = "El nombre no debe superar los 150 caracteres")
    private String name;

    @Size(max = 120, message = "El contacto no debe superar los 120 caracteres")
    private String contactName;

    @Size(max = 30, message = "El telefono no debe superar los 30 caracteres")
    private String phone;

    @Email(message = "El correo no es valido")
    @Size(max = 120, message = "El correo no debe superar los 120 caracteres")
    private String email;

    @Size(max = 500, message = "Las notas no deben superar los 500 caracteres")
    private String notes;
}
