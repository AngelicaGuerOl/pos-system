package com.angelica.pos.auth.service;

import com.angelica.pos.auth.dto.ChangePasswordRequest;
import com.angelica.pos.auth.dto.CurrentUserResponse;
import com.angelica.pos.auth.dto.LoginRequest;
import com.angelica.pos.auth.dto.LoginResponse;
import com.angelica.pos.security.AuthenticatedUser;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    CurrentUserResponse getCurrentUser(AuthenticatedUser authenticatedUser);

    CurrentUserResponse changePassword(AuthenticatedUser authenticatedUser, ChangePasswordRequest request);
}
