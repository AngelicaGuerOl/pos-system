package com.angelica.pos.user.exception;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long id) {
        super("Usuario no encontrado con id: " + id);
    }
}
