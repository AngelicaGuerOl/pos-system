package com.angelica.pos.cash.movement.dto;

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

class ManualCashMovementRequestValidationTest {

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
    void rejectsZeroAmount() {
        ManualCashMovementRequest request = buildRequest("0.00", "Fondo");

        Set<ConstraintViolation<ManualCashMovementRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    @Test
    void rejectsNegativeAmount() {
        ManualCashMovementRequest request = buildRequest("-1.00", "Fondo");

        Set<ConstraintViolation<ManualCashMovementRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    @Test
    void rejectsAmountWithMoreThanTwoDecimals() {
        ManualCashMovementRequest request = buildRequest("1.001", "Fondo");

        Set<ConstraintViolation<ManualCashMovementRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    @Test
    void rejectsBlankDescription() {
        ManualCashMovementRequest request = buildRequest("1.00", "   ");

        Set<ConstraintViolation<ManualCashMovementRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    private ManualCashMovementRequest buildRequest(String amount, String description) {
        ManualCashMovementRequest request = new ManualCashMovementRequest();
        request.setAmount(new BigDecimal(amount));
        request.setDescription(description);
        return request;
    }
}
