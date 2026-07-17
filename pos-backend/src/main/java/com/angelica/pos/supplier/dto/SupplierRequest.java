package com.angelica.pos.supplier.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SupplierRequest {

    @Schema(description = "Nombre comercial del proveedor", example = "Barcel")
    @NotBlank(message = "El nombre del proveedor es obligatorio")
    @Size(max = 150, message = "El nombre no debe superar los 150 caracteres")
    private String name;

    @Schema(description = "Nombre de contacto", example = "Laura Pérez", nullable = true)
    @Size(max = 120, message = "El contacto no debe superar los 120 caracteres")
    private String contactName;

    @Schema(description = "Teléfono de contacto", example = "5551234567", nullable = true)
    @Size(max = 30, message = "El telefono no debe superar los 30 caracteres")
    private String phone;

    @Schema(description = "Correo de contacto", example = "contacto@example.com", nullable = true)
    @Email(message = "El correo no es valido")
    @Size(max = 120, message = "El correo no debe superar los 120 caracteres")
    private String email;

    @Schema(description = "Notas internas", example = "Entrega los lunes", nullable = true)
    @Size(max = 500, message = "Las notas no deben superar los 500 caracteres")
    private String notes;
}
