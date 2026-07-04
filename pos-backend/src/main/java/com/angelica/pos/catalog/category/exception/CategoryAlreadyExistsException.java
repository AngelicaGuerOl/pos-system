package com.angelica.pos.catalog.category.exception;

public class CategoryAlreadyExistsException extends RuntimeException {

    public CategoryAlreadyExistsException(String name) {
        super("Ya existe una categoria con el nombre: " + name);
    }
}
