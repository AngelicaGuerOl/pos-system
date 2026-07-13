package com.angelica.pos.inventory.movement.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ManualInventoryMovementRequestValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidatorFactory() {
        validatorFactory.close();
    }

    @Test
    void validRequestHasNoViolations() {
        ManualInventoryMovementRequest request = buildRequest(new BigDecimal("20.00"), "Recepcion de mercancia");

        Set<ConstraintViolation<ManualInventoryMovementRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
    }

    @Test
    void rejectsZeroQuantity() {
        ManualInventoryMovementRequest request = buildRequest(BigDecimal.ZERO, "Recepcion");

        Set<ConstraintViolation<ManualInventoryMovementRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    @Test
    void rejectsBlankDescription() {
        ManualInventoryMovementRequest request = buildRequest(new BigDecimal("1.00"), "   ");

        Set<ConstraintViolation<ManualInventoryMovementRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    @Test
    void rejectsMoreThanTwoDecimals() {
        ManualInventoryMovementRequest request = buildRequest(new BigDecimal("1.001"), "Recepcion");

        Set<ConstraintViolation<ManualInventoryMovementRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    private ManualInventoryMovementRequest buildRequest(BigDecimal quantity, String description) {
        ManualInventoryMovementRequest request = new ManualInventoryMovementRequest();
        request.setProductId(15L);
        request.setQuantity(quantity);
        request.setDescription(description);
        return request;
    }
}
