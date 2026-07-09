package com.angelica.pos.auth.service;

import com.angelica.pos.auth.dto.ChangePasswordRequest;
import com.angelica.pos.auth.dto.CurrentUserResponse;
import com.angelica.pos.auth.dto.LoginRequest;
import com.angelica.pos.auth.dto.LoginResponse;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.security.JwtService;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String normalizedUsername = request.getUsername().trim();
        User user = userRepository.findByUsernameIgnoreCaseAndActiveTrue(normalizedUsername)
                .orElseThrow(() -> new BadCredentialsException("Credenciales invalidas"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Credenciales invalidas");
        }

        String token = jwtService.generateToken(user);

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationSeconds())
                .user(toCurrentUserResponse(user))
                .build();
    }

    @Override
    public CurrentUserResponse getCurrentUser(AuthenticatedUser authenticatedUser) {
        return new CurrentUserResponse(
                authenticatedUser.getId(),
                authenticatedUser.getUsername(),
                authenticatedUser.getRole(),
                authenticatedUser.getMustChangePassword()
        );
    }

    @Override
    @Transactional
    public CurrentUserResponse changePassword(AuthenticatedUser authenticatedUser, ChangePasswordRequest request) {
        User user = userRepository.findByIdAndActiveTrue(authenticatedUser.getId())
                .orElseThrow(() -> new BadCredentialsException("Credenciales invalidas"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Credenciales invalidas");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("La nueva contrasena debe ser diferente a la actual");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);

        return toCurrentUserResponse(user);
    }

    private CurrentUserResponse toCurrentUserResponse(User user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getMustChangePassword()
        );
    }
}
