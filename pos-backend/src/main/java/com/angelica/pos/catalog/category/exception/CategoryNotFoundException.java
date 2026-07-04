package com.angelica.pos.catalog.category.exception;

public class CategoryNotFoundException extends RuntimeException {

    public CategoryNotFoundException(Long id) {
        super("No se encontro una categoria activa con id: " + id);
    }
}
