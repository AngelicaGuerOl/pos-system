package com.angelica.pos.user.dto;

import com.angelica.pos.user.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserUpdateRequest {

    @NotBlank(message = "El usuario es obligatorio")
    @Size(max = 100, message = "El usuario no debe superar los 100 caracteres")
    private String username;

    @NotNull(message = "El rol es obligatorio")
    private Role role;

    @NotNull(message = "El estado activo es obligatorio")
    private Boolean active;
}
