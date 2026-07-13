package com.angelica.pos.inventory.movement.service;

import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.catalog.product.exception.ProductNotFoundException;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.dto.InventoryMovementResponse;
import com.angelica.pos.inventory.movement.dto.ManualInventoryMovementRequest;
import com.angelica.pos.inventory.movement.entity.InventoryMovement;
import com.angelica.pos.inventory.movement.entity.InventoryMovementDirection;
import com.angelica.pos.inventory.movement.entity.InventoryMovementType;
import com.angelica.pos.inventory.movement.exception.InsufficientStockException;
import com.angelica.pos.inventory.movement.mapper.InventoryMovementMapper;
import com.angelica.pos.inventory.movement.repository.InventoryMovementRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InventoryMovementServiceImplTest {

    private InventoryMovementRepository inventoryMovementRepository;
    private ProductRepository productRepository;
    private UserRepository userRepository;
    private InventoryMovementMapper inventoryMovementMapper;
    private InventoryMovementServiceImpl inventoryMovementService;

    @BeforeEach
    void setUp() {
        inventoryMovementRepository = mock(InventoryMovementRepository.class);
        productRepository = mock(ProductRepository.class);
        userRepository = mock(UserRepository.class);
        inventoryMovementMapper = mock(InventoryMovementMapper.class);
        inventoryMovementService = new InventoryMovementServiceImpl(
                inventoryMovementRepository,
                productRepository,
                userRepository,
                inventoryMovementMapper
        );
    }

    @Test
    void registerManualEntryIncreasesStockAndStoresAuditValues() {
        User user = buildUser(5L);
        Product product = buildProduct(15L, "Producto", "10.00", true);
        ManualInventoryMovementRequest request = buildRequest(15L, "20.00", "  Recepcion  ");
        InventoryMovementResponse response = buildResponse(1L, InventoryMovementDirection.IN, InventoryMovementType.MANUAL_ENTRY);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findByIdAndActiveTrueForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(inventoryMovementMapper.toResponse(any(InventoryMovement.class))).thenReturn(response);

        InventoryMovementResponse result = inventoryMovementService.registerManualEntry(request, new AuthenticatedUser(user));

        assertEquals(1L, result.getId());
        assertEquals(new BigDecimal("30.00"), product.getCurrentStock());
        verify(inventoryMovementRepository).save(org.mockito.ArgumentMatchers.argThat(movement ->
                movement.getProduct() == product
                        && movement.getCreatedBy() == user
                        && movement.getDirection() == InventoryMovementDirection.IN
                        && movement.getType() == InventoryMovementType.MANUAL_ENTRY
                        && movement.getQuantity().compareTo(new BigDecimal("20.00")) == 0
                        && movement.getPreviousStock().compareTo(new BigDecimal("10.00")) == 0
                        && movement.getNewStock().compareTo(new BigDecimal("30.00")) == 0
                        && movement.getDescription().equals("Recepcion")
                        && movement.getSourceType() == null
                        && movement.getSourceId() == null
        ));
    }

    @Test
    void registerManualExitDecreasesStockAndStoresAuditValues() {
        User user = buildUser(5L);
        Product product = buildProduct(15L, "Producto", "10.00", true);
        ManualInventoryMovementRequest request = buildRequest(15L, "3.00", "Producto danado");
        InventoryMovementResponse response = buildResponse(2L, InventoryMovementDirection.OUT, InventoryMovementType.MANUAL_EXIT);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findByIdAndActiveTrueForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(inventoryMovementMapper.toResponse(any(InventoryMovement.class))).thenReturn(response);

        InventoryMovementResponse result = inventoryMovementService.registerManualExit(request, new AuthenticatedUser(user));

        assertEquals(2L, result.getId());
        assertEquals(new BigDecimal("7.00"), product.getCurrentStock());
        verify(inventoryMovementRepository).save(org.mockito.ArgumentMatchers.argThat(movement ->
                movement.getDirection() == InventoryMovementDirection.OUT
                        && movement.getType() == InventoryMovementType.MANUAL_EXIT
                        && movement.getPreviousStock().compareTo(new BigDecimal("10.00")) == 0
                        && movement.getNewStock().compareTo(new BigDecimal("7.00")) == 0
        ));
    }

    @Test
    void registerManualMovementRejectsZeroQuantity() {
        User user = buildUser(5L);

        assertThrows(
                IllegalArgumentException.class,
                () -> inventoryMovementService.registerManualEntry(buildRequest(15L, "0.00", "Entrada"), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualMovementRejectsNegativeQuantity() {
        User user = buildUser(5L);

        assertThrows(
                IllegalArgumentException.class,
                () -> inventoryMovementService.registerManualExit(buildRequest(15L, "-1.00", "Salida"), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualMovementRejectsBlankDescription() {
        User user = buildUser(5L);

        assertThrows(
                IllegalArgumentException.class,
                () -> inventoryMovementService.registerManualEntry(buildRequest(15L, "1.00", "   "), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualMovementRejectsMoreThanTwoDecimals() {
        User user = buildUser(5L);

        assertThrows(
                IllegalArgumentException.class,
                () -> inventoryMovementService.registerManualEntry(buildRequest(15L, "1.001", "Entrada"), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualMovementRejectsInactiveOrMissingProduct() {
        User user = buildUser(5L);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findByIdAndActiveTrueForUpdate(15L)).thenReturn(Optional.empty());

        assertThrows(
                ProductNotFoundException.class,
                () -> inventoryMovementService.registerManualEntry(buildRequest(15L, "1.00", "Entrada"), new AuthenticatedUser(user))
        );
    }

    @Test
    void registerManualExitRejectsQuantityGreaterThanAvailableStock() {
        User user = buildUser(5L);
        Product product = buildProduct(15L, "Producto", "2.00", true);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findByIdAndActiveTrueForUpdate(product.getId())).thenReturn(Optional.of(product));

        assertThrows(
                InsufficientStockException.class,
                () -> inventoryMovementService.registerManualExit(buildRequest(15L, "3.00", "Salida"), new AuthenticatedUser(user))
        );
        assertEquals(new BigDecimal("2.00"), product.getCurrentStock());
    }

    @Test
    void registerInitialStockCreatesSourcedMovement() {
        User user = buildUser(5L);
        Product product = buildProduct(15L, "Producto", "0.00", true);
        InventoryMovementResponse response = buildResponse(3L, InventoryMovementDirection.IN, InventoryMovementType.INITIAL_STOCK);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findByIdAndActiveTrueForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(inventoryMovementMapper.toResponse(any(InventoryMovement.class))).thenReturn(response);

        inventoryMovementService.registerInitialStock(15L, new BigDecimal("8.00"), new AuthenticatedUser(user));

        assertEquals(new BigDecimal("8.00"), product.getCurrentStock());
        verify(inventoryMovementRepository).save(org.mockito.ArgumentMatchers.argThat(movement ->
                movement.getType() == InventoryMovementType.INITIAL_STOCK
                        && movement.getSourceType().equals("PRODUCT_CREATION")
                        && movement.getSourceId().equals(15L)
        ));
    }

    @Test
    void findAllReturnsPaginatedFilteredMovements() {
        Product product = buildProduct(15L, "Producto", "5.00", true);
        User user = buildUser(5L);
        InventoryMovement movement = InventoryMovement.builder().id(1L).product(product).createdBy(user).build();
        InventoryMovementResponse response = buildResponse(1L, InventoryMovementDirection.IN, InventoryMovementType.MANUAL_ENTRY);
        PageRequest pageable = PageRequest.of(0, 10);

        when(inventoryMovementRepository.findAll(
                org.mockito.ArgumentMatchers.<Specification<InventoryMovement>>any(),
                eq(pageable)
        )).thenReturn(new PageImpl<>(List.of(movement), pageable, 1));
        when(inventoryMovementMapper.toResponseList(List.of(movement))).thenReturn(List.of(response));

        PageResponse<InventoryMovementResponse> result = inventoryMovementService.findAll(
                " prod ",
                15L,
                InventoryMovementDirection.IN,
                InventoryMovementType.MANUAL_ENTRY,
                null,
                null,
                pageable
        );

        assertEquals(1, result.getContent().size());
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void findAllRejectsPageSizeGreaterThanFifty() {
        assertThrows(
                IllegalArgumentException.class,
                () -> inventoryMovementService.findAll(null, null, null, null, null, null, PageRequest.of(0, 51))
        );
    }

    private ManualInventoryMovementRequest buildRequest(Long productId, String quantity, String description) {
        ManualInventoryMovementRequest request = new ManualInventoryMovementRequest();
        request.setProductId(productId);
        request.setQuantity(new BigDecimal(quantity));
        request.setDescription(description);
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

    private Product buildProduct(Long id, String name, String stock, Boolean active) {
        return Product.builder()
                .id(id)
                .barcode("7500000000000")
                .name(name)
                .unit(ProductUnit.PIECE)
                .costPrice(BigDecimal.ONE)
                .salePrice(BigDecimal.TEN)
                .currentStock(new BigDecimal(stock))
                .minimumStock(BigDecimal.ZERO)
                .active(active)
                .build();
    }

    private User buildUser(Long id) {
        return User.builder()
                .id(id)
                .username("admin")
                .passwordHash("password-hash")
                .role(Role.ADMIN)
                .active(true)
                .mustChangePassword(false)
                .build();
    }
}
