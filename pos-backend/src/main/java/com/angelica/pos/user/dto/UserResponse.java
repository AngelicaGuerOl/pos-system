package com.angelica.pos.user.dto;

import com.angelica.pos.user.entity.Role;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
public class UserResponse {

    private Long id;
    private String username;
    private Role role;
    private Boolean active;
    private Boolean mustChangePassword;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
