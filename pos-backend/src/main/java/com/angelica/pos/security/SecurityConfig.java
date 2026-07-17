package com.angelica.pos.security;

import com.angelica.pos.shared.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final MustChangePasswordFilter mustChangePasswordFilter;
    private final CustomUserDetailsService customUserDetailsService;
    private final ObjectMapper objectMapper;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(this::handleUnauthorized)
                        .accessDeniedHandler(this::handleForbidden)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs.yaml",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/change-password").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/dashboard/summary")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/users", "/api/users/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reports/**").hasRole("ADMIN")
                        .requestMatchers("/api/suppliers", "/api/suppliers/**").hasRole("ADMIN")
                        .requestMatchers("/api/supplier-entries", "/api/supplier-entries/**").hasRole("ADMIN")
                        .requestMatchers("/api/supplier-settlements", "/api/supplier-settlements/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/products").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/inventory-movements/entries").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/inventory-movements/exits").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/inventory-movements", "/api/inventory-movements/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/products/*/inventory-movements").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/categories", "/api/categories/**")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/customers/*/receivables")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/customers", "/api/customers/**")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.POST, "/api/customers").hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.PUT, "/api/customers/**").hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.PATCH, "/api/customers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/cash-sessions/open")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/cash-sessions/current")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/cash-sessions/current/closing-preview")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.POST, "/api/cash-sessions/current/close")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.POST, "/api/cash-movements/entries")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.POST, "/api/cash-movements/exits")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/cash-movements/current")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/cash-movements/current/summary")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.POST, "/api/sales")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.POST, "/api/sales/*/cancel")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.POST, "/api/sales/*/returns")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/sales/*/returns")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/sale-returns/*")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.POST, "/api/receivables/*/payments")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/receivables/*/payments")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/receivable-payments/*")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/receivables/*")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/receivables")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/sales/current-session")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/sales/*")
                        .hasAnyRole("ADMIN", "CASHIER")
                        .requestMatchers(HttpMethod.GET, "/api/sales")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/cash-sessions/*/movements")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/cash-sessions/*/closing-summary")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/cash-sessions", "/api/cash-sessions/**")
                        .hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(mustChangePasswordFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();

        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(customUserDetailsService);
        authenticationProvider.setPasswordEncoder(passwordEncoder());
        return authenticationProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtAuthenticationFilterRegistration() {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(jwtAuthenticationFilter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public FilterRegistrationBean<MustChangePasswordFilter> mustChangePasswordFilterRegistration() {
        FilterRegistrationBean<MustChangePasswordFilter> registration = new FilterRegistrationBean<>(mustChangePasswordFilter);
        registration.setEnabled(false);
        return registration;
    }

    private void handleUnauthorized(
            HttpServletRequest request,
            HttpServletResponse response,
            Exception exception
    ) throws IOException {
        Object jwtException = request.getAttribute("jwtException");
        String message = jwtException == null ? "No autorizado" : "Token invalido o expirado";
        writeErrorResponse(response, HttpStatus.UNAUTHORIZED, message, request.getRequestURI());
    }

    private void handleForbidden(
            HttpServletRequest request,
            HttpServletResponse response,
            Exception exception
    ) throws IOException {
        writeErrorResponse(response, HttpStatus.FORBIDDEN, "Acceso prohibido", request.getRequestURI());
    }

    private void writeErrorResponse(
            HttpServletResponse response,
            HttpStatus status,
            String message,
            String path
    ) throws IOException {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(OffsetDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(path)
                .build();

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
