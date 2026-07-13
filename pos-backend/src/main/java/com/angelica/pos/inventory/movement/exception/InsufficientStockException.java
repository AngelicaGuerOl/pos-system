package com.angelica.pos.inventory.movement.exception;

import java.math.BigDecimal;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String productName, BigDecimal availableStock, BigDecimal requestedQuantity) {
        super("Stock insuficiente para el producto " + productName
                + ". Disponible: " + availableStock
                + ", solicitado: " + requestedQuantity);
    }
}
