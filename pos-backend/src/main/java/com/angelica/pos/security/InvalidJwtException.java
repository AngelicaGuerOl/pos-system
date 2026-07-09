package com.angelica.pos.security;

public class InvalidJwtException extends RuntimeException {

    public InvalidJwtException(String message, Throwable cause) {
        super(message, cause);
    }
}
