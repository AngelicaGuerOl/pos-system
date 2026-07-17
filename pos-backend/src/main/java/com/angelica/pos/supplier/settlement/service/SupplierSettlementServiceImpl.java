package com.angelica.pos.supplier.settlement.service;

import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.exception.ProductNotFoundException;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.entity.InventoryMovementDirection;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.supplier.entity.SupplierInventoryBaseline;
import com.angelica.pos.supplier.entity.SupplierInventoryBaselineItem;
import com.angelica.pos.supplier.entry.repository.SupplierEntryRepository;
import com.angelica.pos.supplier.exception.SupplierInventoryBaselineNotFoundException;
import com.angelica.pos.supplier.exception.SupplierInactiveException;
import com.angelica.pos.supplier.exception.SupplierNotFoundException;
import com.angelica.pos.supplier.repository.SupplierInventoryBaselineRepository;
import com.angelica.pos.supplier.repository.SupplierRepository;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementCreateRequest;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementItemUpdateRequest;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementResponse;
import com.angelica.pos.supplier.settlement.dto.SupplierSettlementUpdateRequest;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlement;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementItem;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementStatus;
import com.angelica.pos.supplier.settlement.exception.SupplierSettlementAlreadyFinalizedException;
import com.angelica.pos.supplier.settlement.exception.SupplierSettlementDraftAlreadyExistsException;
import com.angelica.pos.supplier.settlement.exception.SupplierSettlementIncompleteClosingException;
import com.angelica.pos.supplier.settlement.exception.SupplierSettlementInvalidDeliveredAmountException;
import com.angelica.pos.supplier.settlement.exception.SupplierSettlementInvalidPeriodException;
import com.angelica.pos.supplier.settlement.exception.SupplierSettlementNotFoundException;
import com.angelica.pos.supplier.settlement.exception.SupplierSettlementNotesRequiredException;
import com.angelica.pos.supplier.settlement.mapper.SupplierSettlementMapper;
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
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SupplierSettlementServiceImpl implements SupplierSettlementService {

    private static final int MAX_PAGE_SIZE = 50;

    private final SupplierSettlementRepository settlementRepository;
    private final SupplierInventoryBaselineRepository baselineRepository;
    private final SupplierEntryRepository entryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryMovementService inventoryMovementService;
    private final SupplierSettlementMapper settlementMapper;

    @Override
    @Transactional
    public SupplierSettlementResponse create(SupplierSettlementCreateRequest request, AuthenticatedUser authenticatedUser) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new SupplierNotFoundException(request.getSupplierId()));
        if (!Boolean.TRUE.equals(supplier.getActive())) {
            throw new SupplierInactiveException(request.getSupplierId());
        }
        SupplierInventoryBaseline baseline = baselineRepository.findBySupplierId(request.getSupplierId())
                .orElseThrow(() -> new SupplierInventoryBaselineNotFoundException(request.getSupplierId()));
        if (settlementRepository.existsBySupplierIdAndStatus(request.getSupplierId(), SupplierSettlementStatus.DRAFT)) {
            throw new SupplierSettlementDraftAlreadyExistsException(request.getSupplierId());
        }
        SupplierSettlement previous = settlementRepository.findFirstBySupplierIdAndStatusOrderByPeriodEndDesc(
                request.getSupplierId(),
                SupplierSettlementStatus.FINALIZED
        ).orElse(null);
        LocalDate periodStart = previous == null
                ? baseline.getBaselineDate().plusDays(1)
                : previous.getPeriodEnd().plusDays(1);
        if (request.getPeriodEnd().isBefore(periodStart)) {
            throw new SupplierSettlementInvalidPeriodException();
        }
        User user = userRepository.findByIdAndActiveTrue(authenticatedUser.getId())
                .orElseThrow(() -> new UserNotFoundException(authenticatedUser.getId()));

        SupplierSettlement settlement = SupplierSettlement.builder()
                .supplier(supplier)
                .periodStart(periodStart)
                .periodEnd(request.getPeriodEnd())
                .status(SupplierSettlementStatus.DRAFT)
                .createdBy(user)
                .openingInventoryValue(BigDecimal.ZERO)
                .entriesSaleValue(BigDecimal.ZERO)
                .availableInventoryValue(BigDecimal.ZERO)
                .closingInventoryValue(BigDecimal.ZERO)
                .expectedAmount(BigDecimal.ZERO)
                .hasDiscrepancies(false)
                .build();

        for (Product product : collectSettlementProducts(request.getSupplierId(), periodStart, request.getPeriodEnd(), baseline, previous)) {
            OpeningSnapshot opening = openingForProduct(product.getId(), baseline, previous);
            BigDecimal receivedQuantity = entryRepository.sumQuantityByProductAndPeriod(
                    request.getSupplierId(), product.getId(), periodStart, request.getPeriodEnd());
            BigDecimal receivedValue = entryRepository.sumSaleValueByProductAndPeriod(
                    request.getSupplierId(), product.getId(), periodStart, request.getPeriodEnd());
            BigDecimal availableQuantity = opening.quantity().add(receivedQuantity);
            settlement.addItem(SupplierSettlementItem.builder()
                    .product(product)
                    .productNameSnapshot(product.getName())
                    .barcodeSnapshot(product.getBarcode())
                    .unitSnapshot(product.getUnit())
                    .openingQuantity(opening.quantity())
                    .openingSalePrice(opening.salePrice())
                    .openingValue(opening.value())
                    .receivedQuantity(receivedQuantity)
                    .receivedSaleValue(receivedValue)
                    .availableQuantity(availableQuantity)
                    .closingQuantity(null)
                    .closingSalePrice(product.getSalePrice())
                    .closingValue(BigDecimal.ZERO)
                    .quantityToJustify(availableQuantity)
                    .expectedAmount(opening.value().add(receivedValue))
                    .hasDiscrepancy(false)
                    .build());
        }
        recalculate(settlement);
        return settlementMapper.toResponse(settlementRepository.save(settlement));
    }

    @Override
    @Transactional
    public SupplierSettlementResponse update(Long id, SupplierSettlementUpdateRequest request) {
        SupplierSettlement settlement = settlementRepository.findWithItemsByIdForUpdate(id)
                .orElseThrow(() -> new SupplierSettlementNotFoundException(id));
        ensureDraft(settlement);
        applyClosingRequest(settlement, request);
        recalculate(settlement);
        return settlementMapper.toResponse(settlement);
    }

    @Override
    @Transactional
    public SupplierSettlementResponse finalize(Long id, AuthenticatedUser authenticatedUser) {
        SupplierSettlement settlement = settlementRepository.findWithItemsByIdForUpdate(id)
                .orElseThrow(() -> new SupplierSettlementNotFoundException(id));
        ensureDraft(settlement);
        if (settlement.getDeliveredAmount() == null || settlement.getDeliveredAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new SupplierSettlementInvalidDeliveredAmountException();
        }
        requireCompleteClosing(settlement);
        recalculate(settlement);
        if ((settlement.getDifferenceAmount() != null && settlement.getDifferenceAmount().compareTo(BigDecimal.ZERO) != 0)
                || Boolean.TRUE.equals(settlement.getHasDiscrepancies())) {
            if (settlement.getNotes() == null || settlement.getNotes().isBlank()) {
                throw new SupplierSettlementNotesRequiredException();
            }
        }
        User user = userRepository.findByIdAndActiveTrue(authenticatedUser.getId())
                .orElseThrow(() -> new UserNotFoundException(authenticatedUser.getId()));
        List<Long> orderedIds = settlement.getItems().stream().map(i -> i.getProduct().getId()).sorted().toList();
        Map<Long, Product> lockedProducts = toProductMap(productRepository.findAllByIdInForUpdate(orderedIds));
        for (SupplierSettlementItem item : settlement.getItems()) {
            Product product = lockedProducts.get(item.getProduct().getId());
            if (product == null) {
                throw new ProductNotFoundException(item.getProduct().getId());
            }
            BigDecimal current = product.getCurrentStock();
            BigDecimal closing = item.getClosingQuantity();
            int comparison = closing.compareTo(current);
            if (comparison > 0) {
                inventoryMovementService.registerSupplierSettlementAdjustmentMovement(
                        product, closing.subtract(current), InventoryMovementDirection.IN, item.getId(), user);
            } else if (comparison < 0) {
                inventoryMovementService.registerSupplierSettlementAdjustmentMovement(
                        product, current.subtract(closing), InventoryMovementDirection.OUT, item.getId(), user);
            }
        }
        settlement.setStatus(SupplierSettlementStatus.FINALIZED);
        settlement.setFinalizedBy(user);
        settlement.setFinalizedAt(OffsetDateTime.now());
        return settlementMapper.toResponse(settlement);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupplierSettlementResponse> findAll(Long supplierId, SupplierSettlementStatus status, LocalDate from, LocalDate to, Pageable pageable) {
        validatePageSize(pageable);
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("La fecha inicial no debe ser posterior a la fecha final");
        }
        Page<SupplierSettlement> page = settlementRepository.findAllWithFilters(supplierId, status, from, to, pageable);
        return PageResponse.<SupplierSettlementResponse>builder()
                .content(page.getContent().stream().map(settlementMapper::toResponse).toList())
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
    public SupplierSettlementResponse findById(Long id) {
        return settlementMapper.toResponse(settlementRepository.findWithItemsById(id)
                .orElseThrow(() -> new SupplierSettlementNotFoundException(id)));
    }

    private List<Product> collectSettlementProducts(Long supplierId, LocalDate from, LocalDate to, SupplierInventoryBaseline baseline, SupplierSettlement previous) {
        Set<Long> productIds = new LinkedHashSet<>();
        productRepository.findAllActiveBySupplierId(supplierId).forEach(p -> productIds.add(p.getId()));
        baseline.getItems().forEach(i -> productIds.add(i.getProduct().getId()));
        if (previous != null) {
            previous.getItems().forEach(i -> productIds.add(i.getProduct().getId()));
        }
        productIds.addAll(entryRepository.findProductIdsBySupplierAndPeriod(supplierId, from, to));
        return productRepository.findAllById(productIds).stream()
                .sorted((left, right) -> left.getId().compareTo(right.getId()))
                .toList();
    }

    private OpeningSnapshot openingForProduct(Long productId, SupplierInventoryBaseline baseline, SupplierSettlement previous) {
        if (previous != null) {
            return previous.getItems().stream()
                    .filter(i -> i.getProduct().getId().equals(productId))
                    .findFirst()
                    .map(i -> new OpeningSnapshot(
                            i.getClosingQuantity() == null ? BigDecimal.ZERO : i.getClosingQuantity(),
                            i.getClosingSalePrice(),
                            i.getClosingValue()))
                    .orElse(new OpeningSnapshot(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
        }
        return baseline.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .map(i -> new OpeningSnapshot(i.getQuantity(), i.getSalePriceSnapshot(), i.getInventoryValue()))
                .orElse(new OpeningSnapshot(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
    }

    private void applyClosingRequest(SupplierSettlement settlement, SupplierSettlementUpdateRequest request) {
        Map<Long, SupplierSettlementItem> itemsByProduct = new LinkedHashMap<>();
        for (SupplierSettlementItem item : settlement.getItems()) {
            itemsByProduct.put(item.getProduct().getId(), item);
        }
        if (request.getItems().size() != itemsByProduct.size()) {
            throw new SupplierSettlementIncompleteClosingException();
        }
        Set<Long> seen = new LinkedHashSet<>();
        for (SupplierSettlementItemUpdateRequest itemRequest : request.getItems()) {
            if (!seen.add(itemRequest.getProductId())) {
                throw new IllegalArgumentException("No se permiten productos duplicados");
            }
            SupplierSettlementItem item = itemsByProduct.get(itemRequest.getProductId());
            if (item == null) {
                throw new ProductNotFoundException(itemRequest.getProductId());
            }
            item.setClosingQuantity(itemRequest.getClosingQuantity());
            item.setClosingSalePrice(itemRequest.getClosingSalePrice());
        }
        settlement.setDeliveredAmount(request.getDeliveredAmount());
        settlement.setNotes(normalizeOptional(request.getNotes()));
    }

    private void recalculate(SupplierSettlement settlement) {
        BigDecimal openingTotal = BigDecimal.ZERO;
        BigDecimal entriesTotal = BigDecimal.ZERO;
        BigDecimal closingTotal = BigDecimal.ZERO;
        boolean hasDiscrepancies = false;
        for (SupplierSettlementItem item : settlement.getItems()) {
            item.setOpeningValue(item.getOpeningQuantity().multiply(item.getOpeningSalePrice()));
            item.setAvailableQuantity(item.getOpeningQuantity().add(item.getReceivedQuantity()));
            BigDecimal closingValue = item.getClosingQuantity() == null
                    ? BigDecimal.ZERO
                    : item.getClosingQuantity().multiply(item.getClosingSalePrice());
            item.setClosingValue(closingValue);
            BigDecimal closingQuantity = item.getClosingQuantity() == null ? BigDecimal.ZERO : item.getClosingQuantity();
            item.setQuantityToJustify(item.getAvailableQuantity().subtract(closingQuantity));
            item.setExpectedAmount(item.getOpeningValue().add(item.getReceivedSaleValue()).subtract(closingValue));
            item.setHasDiscrepancy(item.getClosingQuantity() != null && item.getClosingQuantity().compareTo(item.getAvailableQuantity()) > 0);
            openingTotal = openingTotal.add(item.getOpeningValue());
            entriesTotal = entriesTotal.add(item.getReceivedSaleValue());
            closingTotal = closingTotal.add(closingValue);
            hasDiscrepancies = hasDiscrepancies || Boolean.TRUE.equals(item.getHasDiscrepancy());
        }
        settlement.setOpeningInventoryValue(openingTotal);
        settlement.setEntriesSaleValue(entriesTotal);
        settlement.setAvailableInventoryValue(openingTotal.add(entriesTotal));
        settlement.setClosingInventoryValue(closingTotal);
        settlement.setExpectedAmount(openingTotal.add(entriesTotal).subtract(closingTotal));
        settlement.setDifferenceAmount(settlement.getDeliveredAmount() == null
                ? null
                : settlement.getDeliveredAmount().subtract(settlement.getExpectedAmount()));
        settlement.setHasDiscrepancies(hasDiscrepancies);
    }

    private void requireCompleteClosing(SupplierSettlement settlement) {
        for (SupplierSettlementItem item : settlement.getItems()) {
            if (item.getClosingQuantity() == null) {
                throw new SupplierSettlementIncompleteClosingException();
            }
        }
    }

    private void ensureDraft(SupplierSettlement settlement) {
        if (settlement.getStatus() != SupplierSettlementStatus.DRAFT) {
            throw new SupplierSettlementAlreadyFinalizedException(settlement.getId());
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

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private record OpeningSnapshot(BigDecimal quantity, BigDecimal salePrice, BigDecimal value) {
    }
}
