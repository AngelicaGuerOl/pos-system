package com.angelica.pos.security;

import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class BootstrapAdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.enabled:true}")
    private boolean enabled;

    @Value("${app.bootstrap.admin.username:admin}")
    private String username;

    @Value("${app.bootstrap.admin.password:}")
    private String password;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled || userRepository.existsByRoleAndActiveTrue(Role.ADMIN)) {
            return;
        }

        String normalizedUsername = username == null ? "" : username.trim();
        if (normalizedUsername.isBlank()) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_USERNAME is required to create the first admin");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD must have at least 8 characters to create the first admin");
        }
        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new IllegalStateException("Cannot create bootstrap admin because username already exists: " + normalizedUsername);
        }

        User admin = User.builder()
                .username(normalizedUsername)
                .passwordHash(passwordEncoder.encode(password))
                .role(Role.ADMIN)
                .active(true)
                .mustChangePassword(true)
                .build();

        userRepository.save(admin);
    }
}
