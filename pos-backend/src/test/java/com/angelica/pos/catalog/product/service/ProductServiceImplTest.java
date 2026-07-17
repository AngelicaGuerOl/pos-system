package com.angelica.pos.catalog.product.service;

import com.angelica.pos.catalog.category.entity.Category;
import com.angelica.pos.catalog.category.repository.CategoryRepository;
import com.angelica.pos.catalog.product.dto.ProductRequest;
import com.angelica.pos.catalog.product.dto.ProductResponse;
import com.angelica.pos.catalog.product.dto.ProductUpdateRequest;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.catalog.product.mapper.ProductMapper;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.supplier.repository.SupplierRepository;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductServiceImplTest {

    private ProductRepository productRepository;
    private CategoryRepository categoryRepository;
    private SupplierRepository supplierRepository;
    private ProductMapper productMapper;
    private InventoryMovementService inventoryMovementService;
    private ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        supplierRepository = mock(SupplierRepository.class);
        productMapper = mock(ProductMapper.class);
        inventoryMovementService = mock(InventoryMovementService.class);
        productService = new ProductServiceImpl(
                productRepository,
                categoryRepository,
                supplierRepository,
                productMapper,
                inventoryMovementService
        );
    }

    @Test
    void createWithInitialStockSavesProductWithZeroStockAndRegistersInitialMovement() {
        Category category = buildCategory();
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        ProductRequest request = buildCreateRequest("12.50");
        Product product = buildProduct(null, "12.50");
        ProductResponse response = buildResponse(15L, "12.50");

        when(categoryRepository.findByIdAndActiveTrue(category.getId())).thenReturn(Optional.of(category));
        when(productRepository.existsByBarcodeIgnoreCase("ABC123")).thenReturn(false);
        when(productMapper.toEntity(request)).thenReturn(product);
        when(productRepository.save(product)).thenAnswer(invocation -> {
            product.setId(15L);
            return product;
        });
        when(productMapper.toResponse(product)).thenReturn(response);

        ProductResponse result = productService.create(request, authenticatedUser);

        assertEquals(15L, result.getId());
        assertEquals(BigDecimal.ZERO, product.getCurrentStock());
        verify(inventoryMovementService).registerInitialStock(15L, new BigDecimal("12.50"), authenticatedUser);
    }

    @Test
    void createWithZeroStockDoesNotRegisterZeroMovement() {
        Category category = buildCategory();
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        ProductRequest request = buildCreateRequest("0.00");
        Product product = buildProduct(null, "0.00");
        ProductResponse response = buildResponse(15L, "0.00");

        when(categoryRepository.findByIdAndActiveTrue(category.getId())).thenReturn(Optional.of(category));
        when(productRepository.existsByBarcodeIgnoreCase("ABC123")).thenReturn(false);
        when(productMapper.toEntity(request)).thenReturn(product);
        when(productRepository.save(product)).thenAnswer(invocation -> {
            product.setId(15L);
            return product;
        });
        when(productMapper.toResponse(product)).thenReturn(response);

        productService.create(request, authenticatedUser);

        assertEquals(BigDecimal.ZERO, product.getCurrentStock());
        verify(inventoryMovementService, never()).registerInitialStock(15L, BigDecimal.ZERO, authenticatedUser);
    }

    @Test
    void updateKeepsExistingCurrentStock() {
        Category category = buildCategory();
        Product product = buildProduct(15L, "7.00");
        ProductUpdateRequest request = buildUpdateRequest();
        ProductResponse response = buildResponse(15L, "7.00");

        when(productRepository.findByIdAndActiveTrue(15L)).thenReturn(Optional.of(product));
        when(categoryRepository.findByIdAndActiveTrue(category.getId())).thenReturn(Optional.of(category));
        when(productRepository.existsByBarcodeIgnoreCaseAndIdNot("ABC123", 15L)).thenReturn(false);
        when(productMapper.toResponse(product)).thenReturn(response);

        ProductResponse result = productService.update(15L, request);

        assertEquals(new BigDecimal("7.00"), product.getCurrentStock());
        assertEquals(new BigDecimal("7.00"), result.getCurrentStock());
    }

    private ProductRequest buildCreateRequest(String stock) {
        ProductRequest request = new ProductRequest();
        request.setCategoryId(2L);
        request.setBarcode(" ABC123 ");
        request.setName(" Producto ");
        request.setDescription(" Desc ");
        request.setUnit(ProductUnit.PIECE);
        request.setCostPrice(new BigDecimal("5.00"));
        request.setSalePrice(new BigDecimal("10.00"));
        request.setCurrentStock(new BigDecimal(stock));
        request.setMinimumStock(BigDecimal.ONE);
        return request;
    }

    private ProductUpdateRequest buildUpdateRequest() {
        ProductUpdateRequest request = new ProductUpdateRequest();
        request.setCategoryId(2L);
        request.setBarcode(" ABC123 ");
        request.setName(" Producto ");
        request.setDescription(" Desc ");
        request.setUnit(ProductUnit.PIECE);
        request.setCostPrice(new BigDecimal("5.00"));
        request.setSalePrice(new BigDecimal("10.00"));
        request.setMinimumStock(BigDecimal.ONE);
        return request;
    }

    private Product buildProduct(Long id, String stock) {
        return Product.builder()
                .id(id)
                .barcode("ABC123")
                .name("Producto")
                .unit(ProductUnit.PIECE)
                .costPrice(new BigDecimal("5.00"))
                .salePrice(new BigDecimal("10.00"))
                .currentStock(new BigDecimal(stock))
                .minimumStock(BigDecimal.ONE)
                .active(true)
                .build();
    }

    private ProductResponse buildResponse(Long id, String stock) {
        ProductResponse response = new ProductResponse();
        response.setId(id);
        response.setCurrentStock(new BigDecimal(stock));
        return response;
    }

    private Category buildCategory() {
        return Category.builder()
                .id(2L)
                .name("Categoria")
                .active(true)
                .build();
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
