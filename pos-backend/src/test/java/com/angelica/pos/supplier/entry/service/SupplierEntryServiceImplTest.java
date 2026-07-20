package com.angelica.pos.supplier.entry.service;

import com.angelica.pos.catalog.category.entity.Category;
import com.angelica.pos.catalog.category.repository.CategoryRepository;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.catalog.product.exception.ProductAlreadyExistsException;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.repository.InventoryMovementRepository;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.supplier.entry.dto.NewSupplierEntryProductRequest;
import com.angelica.pos.supplier.entry.dto.SupplierEntryItemRequest;
import com.angelica.pos.supplier.entry.dto.SupplierEntryRequest;
import com.angelica.pos.supplier.entry.dto.SupplierEntryResponse;
import com.angelica.pos.supplier.entry.dto.SupplierEntryType;
import com.angelica.pos.supplier.entry.entity.SupplierEntry;
import com.angelica.pos.supplier.entry.mapper.SupplierEntryMapper;
import com.angelica.pos.supplier.entry.repository.SupplierEntryRepository;
import com.angelica.pos.supplier.exception.ProductSupplierMismatchException;
import com.angelica.pos.supplier.repository.SupplierRepository;
import com.angelica.pos.supplier.settlement.repository.SupplierSettlementRepository;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SupplierEntryServiceImplTest {

    private SupplierEntryRepository entryRepository;
    private SupplierSettlementRepository settlementRepository;
    private SupplierRepository supplierRepository;
    private CategoryRepository categoryRepository;
    private ProductRepository productRepository;
    private InventoryMovementRepository inventoryMovementRepository;
    private UserRepository userRepository;
    private InventoryMovementService inventoryMovementService;
    private SupplierEntryMapper entryMapper;
    private SupplierEntryServiceImpl service;

    @BeforeEach
    void setUp() {
        entryRepository = mock(SupplierEntryRepository.class);
        settlementRepository = mock(SupplierSettlementRepository.class);
        supplierRepository = mock(SupplierRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        productRepository = mock(ProductRepository.class);
        inventoryMovementRepository = mock(InventoryMovementRepository.class);
        userRepository = mock(UserRepository.class);
        inventoryMovementService = mock(InventoryMovementService.class);
        entryMapper = mock(SupplierEntryMapper.class);
        service = new SupplierEntryServiceImpl(
                entryRepository,
                settlementRepository,
                supplierRepository,
                categoryRepository,
                productRepository,
                inventoryMovementRepository,
                userRepository,
                inventoryMovementService,
                entryMapper
        );
    }

    @Test
    void createWithNewProductSavesProductWithZeroStockAndRegistersSupplierEntryMovement() {
        Supplier supplier = Supplier.builder().id(3L).name("Proveedor").active(true).build();
        Category category = Category.builder().id(7L).name("Categoria").active(true).build();
        User user = buildUser();
        SupplierEntryRequest request = request(newItem(" 0750000000000 ", " Producto nuevo "));
        SupplierEntryResponse response = new SupplierEntryResponse();
        response.setId(99L);

        mockBase(supplier, user);
        when(categoryRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.of(category));
        when(productRepository.findByBarcodeIgnoreCaseForUpdate("0750000000000")).thenReturn(Optional.empty());
        when(productRepository.saveAndFlush(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(40L);
            return product;
        });
        when(entryRepository.saveAndFlush(any(SupplierEntry.class))).thenAnswer(invocation -> assignEntryIds(invocation.getArgument(0)));
        when(entryMapper.toResponse(any(SupplierEntry.class))).thenReturn(response);

        SupplierEntryResponse result = service.create(request, new AuthenticatedUser(user));

        assertEquals(99L, result.getId());
        verify(productRepository).saveAndFlush(org.mockito.ArgumentMatchers.argThat(product ->
                product.getBarcode().equals("0750000000000")
                        && product.getName().equals("Producto nuevo")
                        && product.getSupplier() == supplier
                        && product.getCategory() == category
                        && product.getCurrentStock().compareTo(BigDecimal.ZERO) == 0
                        && product.getCostPrice().compareTo(new BigDecimal("8.00")) == 0
                        && product.getSalePrice().compareTo(new BigDecimal("12.00")) == 0
        ));
        verify(inventoryMovementService).registerSupplierEntryMovement(
                org.mockito.ArgumentMatchers.argThat(product -> product.getId().equals(40L)
                        && product.getCurrentStock().compareTo(BigDecimal.ZERO) == 0),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("24.00")),
                org.mockito.ArgumentMatchers.eq(1000L),
                org.mockito.ArgumentMatchers.eq(user)
        );
    }

    @Test
    void createRejectsDuplicateNewProductBarcodeInRequest() {
        Supplier supplier = Supplier.builder().id(3L).name("Proveedor").active(true).build();
        User user = buildUser();
        SupplierEntryRequest request = request(
                newItem("7500000000000", "Producto uno"),
                newItem(" 7500000000000 ", "Producto dos")
        );

        mockBase(supplier, user);

        assertThrows(IllegalArgumentException.class, () -> service.create(request, new AuthenticatedUser(user)));
        verify(entryRepository, never()).saveAndFlush(any());
    }

    @Test
    void createRejectsNewProductBarcodeCreatedByAnotherTransaction() {
        Supplier supplier = Supplier.builder().id(3L).name("Proveedor").active(true).build();
        User user = buildUser();
        Product existing = Product.builder().id(88L).barcode("7500000000000").active(true).build();
        SupplierEntryRequest request = request(newItem("7500000000000", "Producto nuevo"));

        mockBase(supplier, user);
        when(productRepository.findByBarcodeIgnoreCaseForUpdate("7500000000000")).thenReturn(Optional.of(existing));

        assertThrows(ProductAlreadyExistsException.class, () -> service.create(request, new AuthenticatedUser(user)));
        verify(entryRepository, never()).saveAndFlush(any());
    }

    @Test
    void createExistingProductUpdatesPricesAndRegistersMovement() {
        Supplier supplier = Supplier.builder().id(3L).name("Proveedor").active(true).build();
        User user = buildUser();
        Product product = Product.builder()
                .id(15L)
                .barcode("ABC123")
                .name("Existente")
                .supplier(supplier)
                .currentStock(new BigDecimal("5.00"))
                .costPrice(new BigDecimal("7.00"))
                .salePrice(new BigDecimal("11.00"))
                .active(true)
                .build();
        SupplierEntryItemRequest item = new SupplierEntryItemRequest();
        item.setProductId(15L);
        item.setQuantity(new BigDecimal("2.00"));
        item.setUnitCost(new BigDecimal("8.00"));
        item.setSalePrice(new BigDecimal("12.00"));

        mockBase(supplier, user);
        when(productRepository.findAllActiveByIdInForUpdate(List.of(15L))).thenReturn(List.of(product));
        when(entryRepository.saveAndFlush(any(SupplierEntry.class))).thenAnswer(invocation -> assignEntryIds(invocation.getArgument(0)));
        when(entryMapper.toResponse(any(SupplierEntry.class))).thenReturn(new SupplierEntryResponse());

        service.create(request(item), new AuthenticatedUser(user));

        assertEquals(new BigDecimal("8.00"), product.getCostPrice());
        assertEquals(new BigDecimal("12.00"), product.getSalePrice());
        verify(inventoryMovementService).registerSupplierEntryMovement(product, new BigDecimal("2.00"), 1000L, user);
    }

    @Test
    void createRejectsExistingProductFromAnotherSupplier() {
        Supplier supplier = Supplier.builder().id(3L).name("Proveedor").active(true).build();
        Supplier otherSupplier = Supplier.builder().id(4L).name("Otro").active(true).build();
        User user = buildUser();
        Product product = Product.builder().id(15L).supplier(otherSupplier).active(true).build();
        SupplierEntryItemRequest item = new SupplierEntryItemRequest();
        item.setProductId(15L);
        item.setQuantity(new BigDecimal("2.00"));
        item.setUnitCost(new BigDecimal("8.00"));
        item.setSalePrice(new BigDecimal("12.00"));

        mockBase(supplier, user);
        when(productRepository.findAllActiveByIdInForUpdate(List.of(15L))).thenReturn(List.of(product));

        assertThrows(ProductSupplierMismatchException.class, () -> service.create(request(item), new AuthenticatedUser(user)));
    }

    @Test
    void createInitialInventoryWithNewProductUsesZeroStockThenInitialMovement() {
        Category category = Category.builder().id(7L).name("Categoria").active(true).build();
        User user = buildUser();
        SupplierEntryRequest request = initialInventoryRequest(null, newItem("7500000000000", "Producto nuevo"));

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.of(category));
        when(productRepository.findByBarcodeIgnoreCaseForUpdate("7500000000000")).thenReturn(Optional.empty());
        when(productRepository.saveAndFlush(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(41L);
            return product;
        });

        SupplierEntryResponse response = service.create(request, new AuthenticatedUser(user));

        assertEquals(SupplierEntryType.INITIAL_INVENTORY, response.getEntryType());
        assertEquals(0, response.getTotalCost().compareTo(new BigDecimal("192.00")));
        verify(productRepository).saveAndFlush(org.mockito.ArgumentMatchers.argThat(product ->
                product.getCurrentStock().compareTo(BigDecimal.ZERO) == 0
                        && product.getSupplier() == null
        ));
        verify(inventoryMovementService).registerInitialStock(
                org.mockito.ArgumentMatchers.eq(41L),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("24.00")),
                org.mockito.ArgumentMatchers.argThat(authenticatedUser -> authenticatedUser.getId().equals(user.getId()))
        );
        verify(entryRepository, never()).saveAndFlush(any());
    }

    @Test
    void createInitialInventoryWithSupplierAssignsSupplierToNewProduct() {
        Supplier supplier = Supplier.builder().id(3L).name("Proveedor").active(true).build();
        Category category = Category.builder().id(7L).name("Categoria").active(true).build();
        User user = buildUser();
        SupplierEntryRequest request = initialInventoryRequest(3L, newItem("7500000000001", "Producto nuevo"));

        when(supplierRepository.findById(3L)).thenReturn(Optional.of(supplier));
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(categoryRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.of(category));
        when(productRepository.findByBarcodeIgnoreCaseForUpdate("7500000000001")).thenReturn(Optional.empty());
        when(productRepository.saveAndFlush(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(42L);
            return product;
        });

        SupplierEntryResponse response = service.create(request, new AuthenticatedUser(user));

        assertEquals(SupplierEntryType.INITIAL_INVENTORY, response.getEntryType());
        assertEquals(3L, response.getSupplierId());
        assertEquals("Proveedor", response.getSupplierName());
        verify(productRepository).saveAndFlush(org.mockito.ArgumentMatchers.argThat(product ->
                product.getSupplier() == supplier
                        && product.getCurrentStock().compareTo(BigDecimal.ZERO) == 0
        ));
        verify(inventoryMovementService).registerInitialStock(
                org.mockito.ArgumentMatchers.eq(42L),
                org.mockito.ArgumentMatchers.eq(new BigDecimal("24.00")),
                org.mockito.ArgumentMatchers.argThat(authenticatedUser -> authenticatedUser.getId().equals(user.getId()))
        );
    }

    @Test
    void createInitialInventoryRejectsExistingProductWithPreviousStock() {
        User user = buildUser();
        Product product = Product.builder()
                .id(15L)
                .name("Existente")
                .currentStock(BigDecimal.ONE)
                .active(true)
                .build();
        SupplierEntryItemRequest item = new SupplierEntryItemRequest();
        item.setProductId(15L);
        item.setQuantity(new BigDecimal("2.00"));
        item.setUnitCost(new BigDecimal("8.00"));
        item.setSalePrice(new BigDecimal("12.00"));

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findAllActiveByIdInForUpdate(List.of(15L))).thenReturn(List.of(product));

        assertThrows(IllegalArgumentException.class, () -> service.create(initialInventoryRequest(null, item), new AuthenticatedUser(user)));
        verify(inventoryMovementService, never()).registerInitialStock(any(), any(), any());
    }

    @Test
    void createInitialInventoryRejectsExistingProductWithPreviousMovements() {
        User user = buildUser();
        Product product = Product.builder()
                .id(15L)
                .name("Existente")
                .currentStock(BigDecimal.ZERO)
                .active(true)
                .build();
        SupplierEntryItemRequest item = new SupplierEntryItemRequest();
        item.setProductId(15L);
        item.setQuantity(new BigDecimal("2.00"));
        item.setUnitCost(new BigDecimal("8.00"));
        item.setSalePrice(new BigDecimal("12.00"));

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findAllActiveByIdInForUpdate(List.of(15L))).thenReturn(List.of(product));
        when(inventoryMovementRepository.existsByProductId(15L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(initialInventoryRequest(null, item), new AuthenticatedUser(user)));
        verify(inventoryMovementService, never()).registerInitialStock(any(), any(), any());
    }

    private void mockBase(Supplier supplier, User user) {
        when(supplierRepository.findById(3L)).thenReturn(Optional.of(supplier));
        when(settlementRepository.existsFinalizedPeriodContaining(3L, LocalDate.parse("2026-07-19"))).thenReturn(false);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
    }

    private SupplierEntryRequest request(SupplierEntryItemRequest... items) {
        SupplierEntryRequest request = new SupplierEntryRequest();
        request.setSupplierId(3L);
        request.setEntryType(SupplierEntryType.SUPPLIER_PURCHASE);
        request.setEntryDate(LocalDate.parse("2026-07-19"));
        request.setItems(List.of(items));
        return request;
    }

    private SupplierEntryRequest initialInventoryRequest(Long supplierId, SupplierEntryItemRequest... items) {
        SupplierEntryRequest request = new SupplierEntryRequest();
        request.setSupplierId(supplierId);
        request.setEntryType(SupplierEntryType.INITIAL_INVENTORY);
        request.setEntryDate(LocalDate.parse("2026-07-19"));
        request.setItems(List.of(items));
        return request;
    }

    private SupplierEntryItemRequest newItem(String barcode, String name) {
        NewSupplierEntryProductRequest newProduct = new NewSupplierEntryProductRequest();
        newProduct.setBarcode(barcode);
        newProduct.setName(name);
        newProduct.setCategoryId(7L);
        newProduct.setUnit(ProductUnit.PIECE);

        SupplierEntryItemRequest item = new SupplierEntryItemRequest();
        item.setNewProduct(newProduct);
        item.setQuantity(new BigDecimal("24.00"));
        item.setUnitCost(new BigDecimal("8.00"));
        item.setSalePrice(new BigDecimal("12.00"));
        return item;
    }

    private SupplierEntry assignEntryIds(SupplierEntry entry) {
        entry.setId(99L);
        long id = 1000L;
        for (var item : entry.getItems()) {
            item.setId(id++);
        }
        return entry;
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
