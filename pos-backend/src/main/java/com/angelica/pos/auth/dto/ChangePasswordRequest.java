package com.angelica.pos.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {

    @Schema(description = "Contraseña actual", example = "Password123!", format = "password", writeOnly = true)
    @NotBlank(message = "La contrasena actual es obligatoria")
    private String currentPassword;

    @Schema(description = "Nueva contraseña, mínimo 8 caracteres", example = "NewPassword123!", format = "password", writeOnly = true)
    @NotBlank(message = "La nueva contrasena es obligatoria")
    @Size(min = 8, message = "La nueva contrasena debe tener al menos 8 caracteres")
    private String newPassword;
}
