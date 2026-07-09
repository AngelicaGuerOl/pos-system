package com.angelica.pos.auth.dto;

import com.angelica.pos.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CurrentUserResponse {

    private Long id;
    private String username;
    private Role role;
    private Boolean mustChangePassword;
}
