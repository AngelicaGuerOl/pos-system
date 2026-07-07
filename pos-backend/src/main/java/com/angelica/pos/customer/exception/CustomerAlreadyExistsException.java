package com.angelica.pos.customer.exception;

public class CustomerAlreadyExistsException extends RuntimeException {

    public CustomerAlreadyExistsException(String firstName, String lastName, String phone) {
        super("Ya existe un cliente activo con el nombre, apellido y telefono indicados: "
                + firstName + " " + lastName + " - " + phone);
    }
}
