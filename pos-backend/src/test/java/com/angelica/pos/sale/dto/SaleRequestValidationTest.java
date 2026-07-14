package com.angelica.pos.sale.dto;

import com.angelica.pos.sale.entity.SaleType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SaleRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void validCashSaleRequestPassesValidation() {
        SaleRequest request = validRequest();

        Set<ConstraintViolation<SaleRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
    }

    @Test
    void emptyItemsIsRejected() {
        SaleRequest request = validRequest();
        request.setItems(List.of());

        Set<ConstraintViolation<SaleRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    @Test
    void invalidQuantityIsRejected() {
        SaleRequest request = validRequest();
        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(1L);
        item.setQuantity(new BigDecimal("1.001"));
        request.setItems(List.of(item));

        Set<ConstraintViolation<SaleRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    @Test
    void nonPositiveProductIdIsRejected() {
        SaleRequest request = validRequest();
        request.getItems().get(0).setProductId(0L);

        Set<ConstraintViolation<SaleRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
    }

    private SaleRequest validRequest() {
        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(1L);
        item.setQuantity(new BigDecimal("2.00"));

        SaleRequest request = new SaleRequest();
        request.setSaleType(SaleType.CASH);
        request.setCashReceived(new BigDecimal("400.00"));
        request.setItems(List.of(item));
        return request;
    }
}
