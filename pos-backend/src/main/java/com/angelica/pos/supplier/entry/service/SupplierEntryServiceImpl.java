package com.angelica.pos.supplier.entry.service;

import com.angelica.pos.catalog.category.entity.Category;
import com.angelica.pos.catalog.category.exception.CategoryNotFoundException;
import com.angelica.pos.catalog.category.repository.CategoryRepository;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.exception.ProductNotFoundException;
import com.angelica.pos.catalog.product.exception.ProductAlreadyExistsException;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.repository.InventoryMovementRepository;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.supplier.entry.dto.SupplierEntryItemRequest;
import com.angelica.pos.supplier.entry.dto.SupplierEntryRequest;
import com.angelica.pos.supplier.entry.dto.SupplierEntryResponse;
import com.angelica.pos.supplier.entry.dto.SupplierEntryType;
import com.angelica.pos.supplier.entry.entity.SupplierEntry;
import com.angelica.pos.supplier.entry.entity.SupplierEntryItem;
import com.angelica.pos.supplier.entry.exception.SupplierEntryInClosedPeriodException;
import com.angelica.pos.supplier.entry.exception.SupplierEntryNotFoundException;
import com.angelica.pos.supplier.entry.mapper.SupplierEntryMapper;
import com.angelica.pos.supplier.entry.repository.SupplierEntryRepository;
import com.angelica.pos.supplier.exception.ProductSupplierMismatchException;
import com.angelica.pos.supplier.exception.SupplierInactiveException;
import com.angelica.pos.supplier.exception.SupplierNotFoundException;
import com.angelica.pos.supplier.repository.SupplierRepository;
import com.angelica.pos.supplier.settlement.repository.SupplierSettlementRepository;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SupplierEntryServiceImpl implements SupplierEntryService {

    private static final int MAX_PAGE_SIZE = 50;

    private final SupplierEntryRepository entryRepository;
    private final SupplierSettlementRepository settlementRepository;
    private final SupplierRepository supplierRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final UserRepository userRepository;
    private final InventoryMovementService inventoryMovementService;
    private final SupplierEntryMapper entryMapper;

    @Override
    @Transactional
    public SupplierEntryResponse create(SupplierEntryRequest request, AuthenticatedUser authenticatedUser) {
        if (request.getEntryType() == SupplierEntryType.INITIAL_INVENTORY) {
            return createInitialInventory(request, authenticatedUser);
        }
        return createSupplierPurchase(request, authenticatedUser);
    }

    private SupplierEntryResponse createSupplierPurchase(SupplierEntryRequest request, AuthenticatedUser authenticatedUser) {
        if (request.getSupplierId() == null) {
            throw new IllegalArgumentException("El proveedor es obligatorio para compra a proveedor");
        }

        Supplier supplier = findActiveSupplier(request.getSupplierId());
        if (settlementRepository.existsFinalizedPeriodContaining(request.getSupplierId(), request.getEntryDate())) {
            throw new SupplierEntryInClosedPeriodException();
        }
        validateItems(request);
        Map<Long, SupplierEntryItemRequest> requestsByProductId = collectExistingItems(request);
        List<SupplierEntryItemRequest> newProductRequests = collectNewProductItems(request);
        List<Long> orderedProductIds = requestsByProductId.keySet().stream().sorted().toList();
        List<Product> lockedProducts = productRepository.findAllActiveByIdInForUpdate(orderedProductIds);
        Map<Long, Product> productsById = toProductMap(lockedProducts);
        User user = userRepository.findByIdAndActiveTrue(authenticatedUser.getId())
                .orElseThrow(() -> new UserNotFoundException(authenticatedUser.getId()));

        SupplierEntry entry = SupplierEntry.builder()
                .supplier(supplier)
                .entryDate(request.getEntryDate())
                .registeredBy(user)
                .notes(normalizeOptional(request.getNotes()))
                .totalCost(BigDecimal.ZERO)
                .totalSaleValue(BigDecimal.ZERO)
                .build();

        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalSaleValue = BigDecimal.ZERO;
        for (Long productId : orderedProductIds) {
            Product product = productsById.get(productId);
            if (product == null) {
                throw new ProductNotFoundException(productId);
            }
            if (product.getSupplier() == null || !product.getSupplier().getId().equals(request.getSupplierId())) {
                throw new ProductSupplierMismatchException(productId, request.getSupplierId());
            }
            SupplierEntryItemRequest itemRequest = requestsByProductId.get(productId);
            BigDecimal costSubtotal = itemRequest.getQuantity().multiply(itemRequest.getUnitCost());
            BigDecimal saleSubtotal = itemRequest.getQuantity().multiply(itemRequest.getSalePrice());
            totalCost = totalCost.add(costSubtotal);
            totalSaleValue = totalSaleValue.add(saleSubtotal);
            product.setCostPrice(itemRequest.getUnitCost());
            product.setSalePrice(itemRequest.getSalePrice());
            entry.addItem(SupplierEntryItem.builder()
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .unitCost(itemRequest.getUnitCost())
                    .costKnown(true)
                    .salePrice(itemRequest.getSalePrice())
                    .costSubtotal(costSubtotal)
                    .saleValueSubtotal(saleSubtotal)
                    .build());
        }
        for (SupplierEntryItemRequest itemRequest : newProductRequests) {
            Product product = createNewProduct(itemRequest, supplier);
            BigDecimal costSubtotal = itemRequest.getQuantity().multiply(itemRequest.getUnitCost());
            BigDecimal saleSubtotal = itemRequest.getQuantity().multiply(itemRequest.getSalePrice());
            totalCost = totalCost.add(costSubtotal);
            totalSaleValue = totalSaleValue.add(saleSubtotal);
            entry.addItem(SupplierEntryItem.builder()
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .unitCost(itemRequest.getUnitCost())
                    .costKnown(true)
                    .salePrice(itemRequest.getSalePrice())
                    .costSubtotal(costSubtotal)
                    .saleValueSubtotal(saleSubtotal)
                    .build());
        }
        entry.setTotalCost(totalCost);
        entry.setTotalSaleValue(totalSaleValue);
        SupplierEntry saved = entryRepository.saveAndFlush(entry);
        for (SupplierEntryItem item : saved.getItems()) {
            inventoryMovementService.registerSupplierEntryMovement(item.getProduct(), item.getQuantity(), item.getId(), user);
        }
        SupplierEntryResponse response = entryMapper.toResponse(saved);
        response.setEntryType(SupplierEntryType.SUPPLIER_PURCHASE);
        return response;
    }

    private SupplierEntryResponse createInitialInventory(SupplierEntryRequest request, AuthenticatedUser authenticatedUser) {
        validateItems(request);
        Supplier supplier = request.getSupplierId() == null ? null : findActiveSupplier(request.getSupplierId());
        Map<Long, SupplierEntryItemRequest> requestsByProductId = collectExistingItems(request);
        List<SupplierEntryItemRequest> newProductRequests = collectNewProductItems(request);
        List<Long> orderedProductIds = requestsByProductId.keySet().stream().sorted().toList();
        List<Product> lockedProducts = productRepository.findAllActiveByIdInForUpdate(orderedProductIds);
        Map<Long, Product> productsById = toProductMap(lockedProducts);
        User user = userRepository.findByIdAndActiveTrue(authenticatedUser.getId())
                .orElseThrow(() -> new UserNotFoundException(authenticatedUser.getId()));

        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalSaleValue = BigDecimal.ZERO;

        for (Long productId : orderedProductIds) {
            Product product = productsById.get(productId);
            if (product == null) {
                throw new ProductNotFoundException(productId);
            }
            validateInitialInventoryAllowed(product);
            SupplierEntryItemRequest itemRequest = requestsByProductId.get(productId);
            totalCost = totalCost.add(itemRequest.getQuantity().multiply(itemRequest.getUnitCost()));
            totalSaleValue = totalSaleValue.add(itemRequest.getQuantity().multiply(itemRequest.getSalePrice()));
            product.setCostPrice(itemRequest.getUnitCost());
            product.setSalePrice(itemRequest.getSalePrice());
            inventoryMovementService.registerInitialStock(product.getId(), itemRequest.getQuantity(), authenticatedUser);
        }

        for (SupplierEntryItemRequest itemRequest : newProductRequests) {
            Product product = createNewProduct(itemRequest, supplier);
            totalCost = totalCost.add(itemRequest.getQuantity().multiply(itemRequest.getUnitCost()));
            totalSaleValue = totalSaleValue.add(itemRequest.getQuantity().multiply(itemRequest.getSalePrice()));
            inventoryMovementService.registerInitialStock(product.getId(), itemRequest.getQuantity(), authenticatedUser);
        }

        SupplierEntryResponse response = new SupplierEntryResponse();
        response.setEntryType(SupplierEntryType.INITIAL_INVENTORY);
        response.setSupplierId(supplier == null ? null : supplier.getId());
        response.setSupplierName(supplier == null ? null : supplier.getName());
        response.setEntryDate(request.getEntryDate());
        response.setRegisteredByUserId(user.getId());
        response.setRegisteredByUsername(user.getUsername());
        response.setTotalCost(totalCost);
        response.setTotalSaleValue(totalSaleValue);
        response.setNotes(normalizeOptional(request.getNotes()));
        response.setHistoricalImport(false);
        response.setItems(List.of());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupplierEntryResponse> findAll(Long supplierId, LocalDate from, LocalDate to, Long productId, Pageable pageable) {
        validatePageSize(pageable);
        validateDateRange(from, to);
        Page<SupplierEntry> page = entryRepository.findAllWithFilters(supplierId, from, to, productId, pageable);
        return PageResponse.<SupplierEntryResponse>builder()
                .content(page.getContent().stream().map(entryMapper::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierEntryResponse findById(Long id) {
        return entryMapper.toResponse(entryRepository.findWithItemsById(id)
                .orElseThrow(() -> new SupplierEntryNotFoundException(id)));
    }

    private void validateItems(SupplierEntryRequest request) {
        Set<String> barcodes = new HashSet<>();
        for (SupplierEntryItemRequest item : request.getItems()) {
            if (item.getProductId() == null && item.getNewProduct() == null) {
                throw new IllegalArgumentException("Cada item debe indicar un producto existente o un producto nuevo");
            }
            if (item.getProductId() != null && item.getNewProduct() != null) {
                throw new IllegalArgumentException("No se debe enviar producto nuevo cuando se indica un producto existente");
            }
            if (item.getSalePrice() != null
                    && item.getUnitCost() != null
                    && item.getSalePrice().compareTo(item.getUnitCost()) < 0) {
                throw new IllegalArgumentException("El precio de venta no debe ser menor que el costo unitario");
            }
            if (item.getNewProduct() != null) {
                String barcode = normalizeRequired(item.getNewProduct().getBarcode(), "El codigo de barras es obligatorio para producto nuevo");
                String key = barcode.toLowerCase();
                if (!barcodes.add(key)) {
                    throw new IllegalArgumentException("No se permiten codigos de barras duplicados");
                }
            }
        }
    }

    private Map<Long, SupplierEntryItemRequest> collectExistingItems(SupplierEntryRequest request) {
        Map<Long, SupplierEntryItemRequest> items = new LinkedHashMap<>();
        for (SupplierEntryItemRequest item : request.getItems()) {
            if (item.getProductId() == null) {
                continue;
            }
            if (items.put(item.getProductId(), item) != null) {
                throw new IllegalArgumentException("No se permiten productos duplicados");
            }
        }
        return items;
    }

    private List<SupplierEntryItemRequest> collectNewProductItems(SupplierEntryRequest request) {
        return request.getItems().stream()
                .filter(item -> item.getProductId() == null)
                .sorted((left, right) -> normalizeRequired(
                        left.getNewProduct().getBarcode(),
                        "El codigo de barras es obligatorio para producto nuevo"
                ).compareToIgnoreCase(normalizeRequired(
                        right.getNewProduct().getBarcode(),
                        "El codigo de barras es obligatorio para producto nuevo"
                )))
                .toList();
    }

    private Product createNewProduct(SupplierEntryItemRequest itemRequest, Supplier supplier) {
        String barcode = normalizeRequired(
                itemRequest.getNewProduct().getBarcode(),
                "El codigo de barras es obligatorio para producto nuevo"
        );
        String name = normalizeRequired(
                itemRequest.getNewProduct().getName(),
                "El nombre del producto es obligatorio para producto nuevo"
        );

        if (productRepository.findByBarcodeIgnoreCaseForUpdate(barcode).isPresent()) {
            throw new ProductAlreadyExistsException(barcode);
        }

        Category category = categoryRepository.findByIdAndActiveTrue(itemRequest.getNewProduct().getCategoryId())
                .orElseThrow(() -> new CategoryNotFoundException(itemRequest.getNewProduct().getCategoryId()));

        Product product = Product.builder()
                .category(category)
                .supplier(supplier)
                .barcode(barcode)
                .name(name)
                .unit(itemRequest.getNewProduct().getUnit())
                .costPrice(itemRequest.getUnitCost())
                .costPriceKnown(true)
                .salePrice(itemRequest.getSalePrice())
                .currentStock(BigDecimal.ZERO)
                .minimumStock(itemRequest.getNewProduct().getMinimumStock() == null
                        ? BigDecimal.ZERO
                        : itemRequest.getNewProduct().getMinimumStock())
                .active(true)
                .build();

        return productRepository.saveAndFlush(product);
    }

    private Supplier findActiveSupplier(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new SupplierNotFoundException(supplierId));
        if (!Boolean.TRUE.equals(supplier.getActive())) {
            throw new SupplierInactiveException(supplierId);
        }
        return supplier;
    }

    private void validateInitialInventoryAllowed(Product product) {
        if (product.getCurrentStock() != null && product.getCurrentStock().compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalArgumentException("El producto " + product.getName()
                    + " ya tiene existencias. Usa un ajuste de inventario para corregirlo.");
        }
        if (inventoryMovementRepository.existsByProductId(product.getId())) {
            throw new IllegalArgumentException("El producto " + product.getName()
                    + " ya tiene movimientos. Usa un ajuste de inventario para corregirlo.");
        }
    }

    private Map<Long, Product> toProductMap(List<Product> products) {
        Map<Long, Product> productsById = new HashMap<>();
        for (Product product : products) {
            productsById.put(product.getId(), product);
        }
        return productsById;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException(message);
        }
        return trimmed;
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("La fecha inicial no debe ser posterior a la fecha final");
        }
    }
}
