package com.angelica.pos.supplier.entry.service;

import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.exception.ProductNotFoundException;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.supplier.entry.dto.SupplierEntryItemRequest;
import com.angelica.pos.supplier.entry.dto.SupplierEntryRequest;
import com.angelica.pos.supplier.entry.dto.SupplierEntryResponse;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplierEntryServiceImpl implements SupplierEntryService {

    private static final int MAX_PAGE_SIZE = 50;

    private final SupplierEntryRepository entryRepository;
    private final SupplierSettlementRepository settlementRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryMovementService inventoryMovementService;
    private final SupplierEntryMapper entryMapper;

    @Override
    @Transactional
    public SupplierEntryResponse create(SupplierEntryRequest request, AuthenticatedUser authenticatedUser) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new SupplierNotFoundException(request.getSupplierId()));
        if (!Boolean.TRUE.equals(supplier.getActive())) {
            throw new SupplierInactiveException(request.getSupplierId());
        }
        if (settlementRepository.existsFinalizedPeriodContaining(request.getSupplierId(), request.getEntryDate())) {
            throw new SupplierEntryInClosedPeriodException();
        }
        Map<Long, SupplierEntryItemRequest> requestsByProductId = collectItems(request);
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
        entry.setTotalCost(totalCost);
        entry.setTotalSaleValue(totalSaleValue);
        SupplierEntry saved = entryRepository.saveAndFlush(entry);
        for (SupplierEntryItem item : saved.getItems()) {
            inventoryMovementService.registerSupplierEntryMovement(item.getProduct(), item.getQuantity(), item.getId(), user);
        }
        return entryMapper.toResponse(saved);
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

    private Map<Long, SupplierEntryItemRequest> collectItems(SupplierEntryRequest request) {
        Map<Long, SupplierEntryItemRequest> items = new LinkedHashMap<>();
        for (SupplierEntryItemRequest item : request.getItems()) {
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

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
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
