package com.angelica.pos.security;

import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.WeakKeyException;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private SecretKey signingKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @PostConstruct
    public void init() {
        byte[] secretBytes = decodeSecret(jwtProperties.getSecret());
        try {
            signingKey = Keys.hmacShaKeyFor(secretBytes);
        } catch (WeakKeyException exception) {
            throw new IllegalStateException("JWT_SECRET must decode to at least 32 bytes/256 bits", exception);
        }
    }

    private byte[] decodeSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("security.jwt.secret/JWT_SECRET is required");
        }

        String normalizedSecret = secret.trim();
        try {
            return Decoders.BASE64.decode(normalizedSecret);
        } catch (DecodingException exception) {
            try {
                return Decoders.BASE64URL.decode(normalizedSecret);
            } catch (DecodingException urlException) {
                throw new IllegalStateException("JWT_SECRET must be Base64 or Base64URL encoded", urlException);
            }
        }
    }

    public String generateToken(User user) {
        Instant issuedAt = Instant.now();
        Instant expiration = issuedAt.plus(jwtProperties.getExpirationMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiration))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException exception) {
            throw new InvalidJwtException("Token invalido o expirado", exception);
        }
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    public Role extractRole(String token) {
        return Role.valueOf(parseClaims(token).get("role", String.class));
    }

    public long getExpirationSeconds() {
        return jwtProperties.getExpirationMinutes() * 60;
    }
}
