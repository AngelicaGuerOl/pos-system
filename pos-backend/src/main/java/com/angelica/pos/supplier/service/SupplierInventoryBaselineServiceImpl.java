package com.angelica.pos.supplier.service;

import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.exception.ProductNotFoundException;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.supplier.dto.SupplierInventoryBaselineItemRequest;
import com.angelica.pos.supplier.dto.SupplierInventoryBaselineRequest;
import com.angelica.pos.supplier.dto.SupplierInventoryBaselineResponse;
import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.supplier.entity.SupplierInventoryBaseline;
import com.angelica.pos.supplier.entity.SupplierInventoryBaselineItem;
import com.angelica.pos.supplier.exception.ProductSupplierMismatchException;
import com.angelica.pos.supplier.exception.SupplierInactiveException;
import com.angelica.pos.supplier.exception.SupplierInventoryBaselineAlreadyExistsException;
import com.angelica.pos.supplier.exception.SupplierInventoryBaselineNotFoundException;
import com.angelica.pos.supplier.exception.SupplierNotFoundException;
import com.angelica.pos.supplier.mapper.SupplierInventoryBaselineMapper;
import com.angelica.pos.supplier.repository.SupplierInventoryBaselineRepository;
import com.angelica.pos.supplier.repository.SupplierRepository;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplierInventoryBaselineServiceImpl implements SupplierInventoryBaselineService {

    private final SupplierRepository supplierRepository;
    private final SupplierInventoryBaselineRepository baselineRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryMovementService inventoryMovementService;
    private final SupplierInventoryBaselineMapper baselineMapper;

    @Override
    @Transactional
    public SupplierInventoryBaselineResponse create(
            Long supplierId,
            SupplierInventoryBaselineRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new SupplierNotFoundException(supplierId));
        if (!Boolean.TRUE.equals(supplier.getActive())) {
            throw new SupplierInactiveException(supplierId);
        }
        if (request.getBaselineDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha del inventario inicial no puede ser futura");
        }
        if (baselineRepository.existsBySupplierId(supplierId)) {
            throw new SupplierInventoryBaselineAlreadyExistsException(supplierId);
        }

        Map<Long, SupplierInventoryBaselineItemRequest> requestsByProductId = collectItems(request);
        List<Long> orderedProductIds = requestsByProductId.keySet().stream().sorted().toList();
        List<Product> lockedProducts = productRepository.findAllActiveByIdInForUpdate(orderedProductIds);
        Map<Long, Product> productsById = toProductMap(lockedProducts);
        User user = userRepository.findByIdAndActiveTrue(authenticatedUser.getId())
                .orElseThrow(() -> new UserNotFoundException(authenticatedUser.getId()));

        SupplierInventoryBaseline baseline = SupplierInventoryBaseline.builder()
                .supplier(supplier)
                .baselineDate(request.getBaselineDate())
                .createdBy(user)
                .totalSaleValue(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (Long productId : orderedProductIds) {
            Product product = productsById.get(productId);
            if (product == null) {
                throw new ProductNotFoundException(productId);
            }
            if (product.getSupplier() == null || !product.getSupplier().getId().equals(supplierId)) {
                throw new ProductSupplierMismatchException(productId, supplierId);
            }
            SupplierInventoryBaselineItemRequest itemRequest = requestsByProductId.get(productId);
            BigDecimal value = itemRequest.getQuantity().multiply(itemRequest.getSalePrice());
            total = total.add(value);
            baseline.addItem(SupplierInventoryBaselineItem.builder()
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .salePriceSnapshot(itemRequest.getSalePrice())
                    .inventoryValue(value)
                    .build());
        }
        baseline.setTotalSaleValue(total);
        SupplierInventoryBaseline saved = baselineRepository.saveAndFlush(baseline);

        for (SupplierInventoryBaselineItem item : saved.getItems()) {
            if (item.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
                inventoryMovementService.registerSupplierInitialStockMovement(
                        item.getProduct(),
                        item.getQuantity(),
                        item.getId(),
                        user
                );
            }
        }
        return baselineMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierInventoryBaselineResponse findBySupplier(Long supplierId) {
        if (supplierRepository.findById(supplierId).isEmpty()) {
            throw new SupplierNotFoundException(supplierId);
        }
        SupplierInventoryBaseline baseline = baselineRepository.findBySupplierId(supplierId)
                .orElseThrow(() -> new SupplierInventoryBaselineNotFoundException(supplierId));
        return baselineMapper.toResponse(baseline);
    }

    private Map<Long, SupplierInventoryBaselineItemRequest> collectItems(SupplierInventoryBaselineRequest request) {
        Map<Long, SupplierInventoryBaselineItemRequest> items = new LinkedHashMap<>();
        for (SupplierInventoryBaselineItemRequest item : request.getItems()) {
            if (items.put(item.getProductId(), item) != null) {
                throw new IllegalArgumentException("No se permiten productos duplicados");
            }
        }
        return items;
    }

    private Map<Long, Product> toProductMap(List<Product> products) {
        Map<Long, Product> productsById = new HashMap<>();
        for (Product product : products) {
            productsById.put(product.getId(), product);
        }
        return productsById;
    }
}
