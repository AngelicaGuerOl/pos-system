package com.angelica.pos.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {

    private String token;
    private String tokenType;
    private long expiresIn;
    private CurrentUserResponse user;
}
