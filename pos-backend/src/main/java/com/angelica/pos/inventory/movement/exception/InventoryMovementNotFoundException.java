package com.angelica.pos.inventory.movement.exception;

public class InventoryMovementNotFoundException extends RuntimeException {

    public InventoryMovementNotFoundException(Long id) {
        super("Movimiento de inventario no encontrado con id: " + id);
    }
}
