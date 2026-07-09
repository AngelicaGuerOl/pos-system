package com.angelica.pos.auth.controller;

import com.angelica.pos.auth.dto.ChangePasswordRequest;
import com.angelica.pos.auth.dto.CurrentUserResponse;
import com.angelica.pos.auth.dto.LoginRequest;
import com.angelica.pos.auth.dto.LoginResponse;
import com.angelica.pos.auth.service.AuthService;
import com.angelica.pos.security.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        return ResponseEntity.ok(authService.getCurrentUser(authenticatedUser));
    }

    @PostMapping("/change-password")
    public ResponseEntity<CurrentUserResponse> changePassword(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        return ResponseEntity.ok(authService.changePassword(authenticatedUser, request));
    }
}
