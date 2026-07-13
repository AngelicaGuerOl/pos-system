package com.angelica.pos.inventory.movement.controller;

import com.angelica.pos.inventory.movement.dto.InventoryMovementResponse;
import com.angelica.pos.inventory.movement.dto.ManualInventoryMovementRequest;
import com.angelica.pos.inventory.movement.entity.InventoryMovementDirection;
import com.angelica.pos.inventory.movement.entity.InventoryMovementType;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class InventoryMovementControllerTest {

    private InventoryMovementService inventoryMovementService;
    private InventoryMovementController inventoryMovementController;

    @BeforeEach
    void setUp() {
        inventoryMovementService = mock(InventoryMovementService.class);
        inventoryMovementController = new InventoryMovementController(inventoryMovementService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setContextPath("");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void registerEntryReturnsCreatedWithLocation() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        ManualInventoryMovementRequest request = buildRequest();
        InventoryMovementResponse response = buildResponse(15L, InventoryMovementDirection.IN, InventoryMovementType.MANUAL_ENTRY);

        when(inventoryMovementService.registerManualEntry(request, authenticatedUser)).thenReturn(response);

        ResponseEntity<InventoryMovementResponse> result = inventoryMovementController.registerEntry(request, authenticatedUser);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertNotNull(result.getHeaders().getLocation());
        assertEquals("/api/inventory-movements/15", result.getHeaders().getLocation().getPath());
        assertEquals(response, result.getBody());
    }

    @Test
    void registerExitReturnsCreatedWithLocation() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        ManualInventoryMovementRequest request = buildRequest();
        InventoryMovementResponse response = buildResponse(16L, InventoryMovementDirection.OUT, InventoryMovementType.MANUAL_EXIT);

        when(inventoryMovementService.registerManualExit(request, authenticatedUser)).thenReturn(response);

        ResponseEntity<InventoryMovementResponse> result = inventoryMovementController.registerExit(request, authenticatedUser);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertNotNull(result.getHeaders().getLocation());
        assertEquals("/api/inventory-movements/16", result.getHeaders().getLocation().getPath());
        assertEquals(response, result.getBody());
    }

    @Test
    void findAllReturnsPageResponse() {
        PageRequest pageable = PageRequest.of(0, 10);
        PageResponse<InventoryMovementResponse> pageResponse = PageResponse.<InventoryMovementResponse>builder()
                .content(List.of(buildResponse(1L, InventoryMovementDirection.IN, InventoryMovementType.MANUAL_ENTRY)))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .first(true)
                .last(true)
                .build();

        when(inventoryMovementService.findAll(null, null, null, null, null, null, pageable)).thenReturn(pageResponse);

        ResponseEntity<PageResponse<InventoryMovementResponse>> result =
                inventoryMovementController.findAll(null, null, null, null, null, null, pageable);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(pageResponse, result.getBody());
    }

    private ManualInventoryMovementRequest buildRequest() {
        ManualInventoryMovementRequest request = new ManualInventoryMovementRequest();
        request.setProductId(15L);
        request.setQuantity(new BigDecimal("10.00"));
        request.setDescription("Movimiento");
        return request;
    }

    private InventoryMovementResponse buildResponse(
            Long id,
            InventoryMovementDirection direction,
            InventoryMovementType type
    ) {
        InventoryMovementResponse response = new InventoryMovementResponse();
        response.setId(id);
        response.setDirection(direction);
        response.setType(type);
        return response;
    }

    private User buildUser() {
        return User.builder()
                .id(5L)
                .username("admin")
                .passwordHash("password-hash")
                .role(Role.ADMIN)
                .active(true)
                .mustChangePassword(false)
                .build();
    }
}
