package com.angelica.pos.sale.returning.service;

import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.service.CashMovementService;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.receivable.entity.Receivable;
import com.angelica.pos.receivable.entity.ReceivableStatus;
import com.angelica.pos.receivable.repository.ReceivableRepository;
import com.angelica.pos.sale.entity.Sale;
import com.angelica.pos.sale.entity.SaleItem;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.sale.dto.SaleReceivableResponse;
import com.angelica.pos.sale.exception.SaleAccessDeniedException;
import com.angelica.pos.sale.exception.SaleNotFoundException;
import com.angelica.pos.sale.repository.SaleItemRepository;
import com.angelica.pos.sale.repository.SaleRepository;
import com.angelica.pos.sale.returning.dto.SaleReturnDetailResponse;
import com.angelica.pos.sale.returning.dto.SaleReturnItemRequest;
import com.angelica.pos.sale.returning.dto.SaleReturnItemResponse;
import com.angelica.pos.sale.returning.dto.SaleReturnRequest;
import com.angelica.pos.sale.returning.dto.SaleReturnSummaryResponse;
import com.angelica.pos.sale.returning.entity.SaleReturn;
import com.angelica.pos.sale.returning.entity.SaleReturnItem;
import com.angelica.pos.sale.returning.exception.CreditSaleReceivableRequiredException;
import com.angelica.pos.sale.returning.exception.DuplicateSaleReturnItemException;
import com.angelica.pos.sale.returning.exception.SaleItemDoesNotBelongToSaleException;
import com.angelica.pos.sale.returning.exception.SaleReturnItemNotFoundException;
import com.angelica.pos.sale.returning.exception.SaleReturnNotAllowedException;
import com.angelica.pos.sale.returning.exception.SaleReturnNotFoundException;
import com.angelica.pos.sale.returning.exception.SaleReturnQuantityExceededException;
import com.angelica.pos.sale.returning.mapper.SaleReturnMapper;
import com.angelica.pos.sale.returning.repository.SaleReturnRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SaleReturnServiceImpl implements SaleReturnService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_LINES = 100;
    private static final int MAX_QUANTITY_INTEGER_DIGITS = 8;
    private static final int MAX_SCALE = 2;

    private final SaleReturnRepository saleReturnRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;
    private final ReceivableRepository receivableRepository;
    private final CashSessionRepository cashSessionRepository;
    private final UserRepository userRepository;
    private final InventoryMovementService inventoryMovementService;
    private final CashMovementService cashMovementService;
    private final SaleReturnMapper saleReturnMapper;

    @Override
    @Transactional
    public SaleReturnDetailResponse create(
            Long saleId,
            SaleReturnRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        validateRequest(request);
        User user = findActiveUser(authenticatedUser.getId());
        Sale sale = saleRepository.findByIdForReturnUpdate(saleId)
                .orElseThrow(() -> new SaleNotFoundException(saleId));
        validateSaleAccess(sale, user);
        validateSaleCanBeReturned(sale);

        Map<Long, BigDecimal> quantitiesBySaleItemId = normalizeItems(request.getItems());
        List<Long> orderedSaleItemIds = quantitiesBySaleItemId.keySet().stream().sorted().toList();
        List<SaleItem> lockedSaleItems = saleItemRepository.findAllBySaleIdAndIdInForUpdate(sale.getId(), orderedSaleItemIds);
        Map<Long, SaleItem> saleItemsById = toSaleItemMap(lockedSaleItems);
        validateRequestedItemsBelongToSale(sale.getId(), orderedSaleItemIds, saleItemsById);

        List<Long> orderedProductIds = lockedSaleItems.stream()
                .map(item -> item.getProduct().getId())
                .distinct()
                .sorted()
                .toList();
        Map<Long, Product> productsById = toProductMap(productRepository.findAllByIdInForUpdate(orderedProductIds));

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<SaleReturnItem> returnItems = new ArrayList<>();
        for (Long saleItemId : orderedSaleItemIds) {
            SaleItem saleItem = saleItemsById.get(saleItemId);
            BigDecimal quantity = quantitiesBySaleItemId.get(saleItemId);
            BigDecimal returnedQuantity = saleItem.getReturnedQuantity() == null
                    ? BigDecimal.ZERO
                    : saleItem.getReturnedQuantity();
            BigDecimal returnableQuantity = saleItem.getQuantity().subtract(returnedQuantity);
            if (quantity.compareTo(returnableQuantity) > 0) {
                throw new SaleReturnQuantityExceededException(saleItemId, quantity, returnableQuantity);
            }

            BigDecimal subtotal = quantity.multiply(saleItem.getUnitPrice());
            totalAmount = totalAmount.add(subtotal);
            saleItem.setReturnedQuantity(returnedQuantity.add(quantity));
            returnItems.add(SaleReturnItem.builder()
                    .saleItem(saleItem)
                    .product(productsById.get(saleItem.getProduct().getId()))
                    .quantity(quantity)
                    .unitPrice(saleItem.getUnitPrice())
                    .subtotal(subtotal)
                    .build());
        }

        Receivable receivable = null;
        BigDecimal cashRefundAmount;
        if (sale.getSaleType() == SaleType.CASH) {
            cashRefundAmount = totalAmount;
        } else {
            receivable = receivableRepository.findBySaleIdForUpdate(sale.getId())
                    .orElseThrow(() -> new CreditSaleReceivableRequiredException(sale.getId()));
            cashRefundAmount = applyCreditReturn(receivable, totalAmount);
        }

        CashSession cashSession = cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN)
                .orElseThrow(OpenCashSessionRequiredException::new);

        SaleReturn saleReturn = SaleReturn.builder()
                .sale(sale)
                .cashSession(cashSession)
                .processedBy(user)
                .totalAmount(totalAmount)
                .cashRefundAmount(cashRefundAmount)
                .reason(request.getReason().trim())
                .build();
        returnItems.forEach(saleReturn::addItem);

        SaleReturn savedReturn = saleReturnRepository.saveAndFlush(saleReturn);
        for (SaleReturnItem item : savedReturn.getItems()) {
            inventoryMovementService.registerSaleReturnMovement(
                    item.getProduct(),
                    item.getQuantity(),
                    item.getId(),
                    user
            );
        }
        if (cashRefundAmount.compareTo(BigDecimal.ZERO) > 0) {
            cashMovementService.registerSaleRefund(cashSession, user, cashRefundAmount, savedReturn.getId());
        }

        updateSaleStatus(sale);
        SaleReturnDetailResponse response = toDetailResponse(savedReturn);
        response.setReceivable(toSaleReceivableResponse(receivable));
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SaleReturnSummaryResponse> findBySale(
            Long saleId,
            AuthenticatedUser authenticatedUser,
            Pageable pageable
    ) {
        validatePageSize(pageable);
        User user = findActiveUser(authenticatedUser.getId());
        Sale sale = saleRepository.findByIdWithDetails(saleId)
                .orElseThrow(() -> new SaleNotFoundException(saleId));
        validateSaleAccess(sale, user);

        Page<SaleReturn> returnsPage = saleReturnRepository.findBySaleId(saleId, pageable);
        return PageResponse.<SaleReturnSummaryResponse>builder()
                .content(saleReturnMapper.toSummaryResponseList(returnsPage.getContent()))
                .page(returnsPage.getNumber())
                .size(returnsPage.getSize())
                .totalElements(returnsPage.getTotalElements())
                .totalPages(returnsPage.getTotalPages())
                .first(returnsPage.isFirst())
                .last(returnsPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SaleReturnDetailResponse findById(Long returnId, AuthenticatedUser authenticatedUser) {
        User user = findActiveUser(authenticatedUser.getId());
        SaleReturn saleReturn = saleReturnRepository.findById(returnId)
                .orElseThrow(() -> new SaleReturnNotFoundException(returnId));
        validateSaleAccess(saleReturn.getSale(), user);
        Receivable receivable = findReceivableForResponse(saleReturn.getSale());
        SaleReturnDetailResponse response = toDetailResponse(saleReturn);
        response.setReceivable(toSaleReceivableResponse(receivable));
        return response;
    }

    private SaleReturnDetailResponse toDetailResponse(SaleReturn saleReturn) {
        Sale sale = saleReturn.getSale();
        SaleReturnDetailResponse response = new SaleReturnDetailResponse();
        response.setId(saleReturn.getId());
        response.setSaleId(sale.getId());
        response.setSaleNumber(sale.getId());
        response.setSaleType(sale.getSaleType());
        response.setTotalAmount(saleReturn.getTotalAmount());
        response.setCashRefundAmount(saleReturn.getCashRefundAmount());
        response.setReason(saleReturn.getReason());
        response.setCashSessionId(saleReturn.getCashSession() == null ? null : saleReturn.getCashSession().getId());
        response.setProcessedByUserId(saleReturn.getProcessedBy().getId());
        response.setProcessedByUsername(saleReturn.getProcessedBy().getUsername());
        response.setCreatedAt(saleReturn.getCreatedAt());
        response.setCustomerId(sale.getCustomer() == null ? null : sale.getCustomer().getId());
        response.setCustomerFullName(sale.getCustomer() == null ? null : toCustomerFullName(sale.getCustomer()));
        response.setSaleStatus(sale.getStatus());
        response.setItems(saleReturn.getItems().stream()
                .map(this::toItemResponse)
                .toList());
        return response;
    }

    private SaleReturnItemResponse toItemResponse(SaleReturnItem item) {
        SaleReturnItemResponse response = new SaleReturnItemResponse();
        response.setSaleItemId(item.getSaleItem().getId());
        response.setProductId(item.getProduct().getId());
        response.setProductName(item.getSaleItem().getProductName());
        response.setProductBarcode(item.getSaleItem().getProductBarcode());
        response.setUnit(item.getSaleItem().getProductUnit());
        response.setQuantity(item.getQuantity());
        response.setUnitPrice(item.getUnitPrice());
        response.setSubtotal(item.getSubtotal());
        return response;
    }

    private String toCustomerFullName(com.angelica.pos.customer.entity.Customer customer) {
        return customer.getFirstName() + " " + customer.getLastName();
    }

    private Receivable findReceivableForResponse(Sale sale) {
        if (sale.getSaleType() == SaleType.CREDIT) {
            return receivableRepository.findBySaleId(sale.getId()).orElse(null);
        }
        return null;
    }

    private SaleReceivableResponse toSaleReceivableResponse(Receivable receivable) {
        if (receivable == null) {
            return null;
        }
        return new SaleReceivableResponse(
                receivable.getId(),
                receivable.getOriginalAmount(),
                receivable.getReturnedAmount(),
                receivable.getAdjustedAmount(),
                receivable.getPaidAmount(),
                receivable.getOutstandingBalance(),
                receivable.getStatus()
        );
    }

    private BigDecimal applyCreditReturn(Receivable receivable, BigDecimal returnTotal) {
        BigDecimal returnedAmount = receivable.getReturnedAmount() == null
                ? BigDecimal.ZERO
                : receivable.getReturnedAmount();
        BigDecimal newReturnedAmount = returnedAmount.add(returnTotal);
        BigDecimal newAdjustedAmount = receivable.getOriginalAmount().subtract(newReturnedAmount);
        if (newAdjustedAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new SaleReturnNotAllowedException("La devolucion supera el monto original de la cuenta por cobrar");
        }

        BigDecimal currentPaidAmount = receivable.getPaidAmount();
        BigDecimal cashRefundAmount = BigDecimal.ZERO;
        BigDecimal newPaidAmount = currentPaidAmount;
        if (currentPaidAmount.compareTo(newAdjustedAmount) > 0) {
            cashRefundAmount = currentPaidAmount.subtract(newAdjustedAmount);
            newPaidAmount = newAdjustedAmount;
        }
        BigDecimal newOutstandingBalance = newAdjustedAmount.subtract(newPaidAmount);

        receivable.setReturnedAmount(newReturnedAmount);
        receivable.setAdjustedAmount(newAdjustedAmount);
        receivable.setPaidAmount(newPaidAmount);
        receivable.setOutstandingBalance(newOutstandingBalance);
        updateReceivableStatus(receivable, newAdjustedAmount, newPaidAmount, newOutstandingBalance);
        return cashRefundAmount;
    }

    private void updateReceivableStatus(
            Receivable receivable,
            BigDecimal adjustedAmount,
            BigDecimal paidAmount,
            BigDecimal outstandingBalance
    ) {
        if (adjustedAmount.compareTo(BigDecimal.ZERO) == 0) {
            receivable.setStatus(ReceivableStatus.CANCELLED);
            receivable.setPaidAmount(BigDecimal.ZERO);
            receivable.setOutstandingBalance(BigDecimal.ZERO);
            receivable.setPaidAt(null);
            return;
        }
        if (outstandingBalance.compareTo(BigDecimal.ZERO) == 0) {
            receivable.setStatus(ReceivableStatus.PAID);
            if (receivable.getPaidAt() == null) {
                receivable.setPaidAt(OffsetDateTime.now());
            }
            return;
        }
        if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            receivable.setStatus(ReceivableStatus.PARTIALLY_PAID);
        } else {
            receivable.setStatus(ReceivableStatus.PENDING);
        }
        receivable.setPaidAt(null);
    }

    private void updateSaleStatus(Sale sale) {
        boolean allReturned = sale.getItems().stream()
                .allMatch(item -> item.getReturnedQuantity() != null
                        && item.getReturnedQuantity().compareTo(item.getQuantity()) == 0);
        sale.setStatus(allReturned ? SaleStatus.RETURNED : SaleStatus.PARTIALLY_RETURNED);
    }

    private void validateRequest(SaleReturnRequest request) {
        if (request.getReason() == null || request.getReason().trim().length() < 3) {
            throw new IllegalArgumentException("Reason must have at least 3 characters");
        }
        if (request.getReason().trim().length() > 255) {
            throw new IllegalArgumentException("Reason must have at most 255 characters");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("At least one item is required");
        }
        if (request.getItems().size() > MAX_LINES) {
            throw new IllegalArgumentException("Return must not exceed " + MAX_LINES + " lines");
        }
    }

    private Map<Long, BigDecimal> normalizeItems(List<SaleReturnItemRequest> items) {
        Map<Long, BigDecimal> quantitiesBySaleItemId = new LinkedHashMap<>();
        Set<Long> seenIds = new HashSet<>();
        for (SaleReturnItemRequest item : items) {
            validateItem(item);
            if (!seenIds.add(item.getSaleItemId())) {
                throw new DuplicateSaleReturnItemException(item.getSaleItemId());
            }
            quantitiesBySaleItemId.put(item.getSaleItemId(), item.getQuantity());
        }
        return quantitiesBySaleItemId;
    }

    private void validateItem(SaleReturnItemRequest item) {
        if (item == null) {
            throw new IllegalArgumentException("Item is required");
        }
        if (item.getSaleItemId() == null || item.getSaleItemId() <= 0) {
            throw new IllegalArgumentException("Sale item id must be positive");
        }
        if (item.getQuantity() == null) {
            throw new IllegalArgumentException("Quantity is required");
        }
        if (item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
        if (item.getQuantity().stripTrailingZeros().scale() > MAX_SCALE) {
            throw new IllegalArgumentException("Quantity must have up to 2 decimals");
        }
        if (getIntegerDigits(item.getQuantity()) > MAX_QUANTITY_INTEGER_DIGITS) {
            throw new IllegalArgumentException("Quantity must have up to 8 integer digits");
        }
    }

    private void validateRequestedItemsBelongToSale(
            Long saleId,
            List<Long> requestedIds,
            Map<Long, SaleItem> saleItemsById
    ) {
        for (Long saleItemId : requestedIds) {
            if (!saleItemsById.containsKey(saleItemId)) {
                if (saleItemRepository.existsById(saleItemId)) {
                    throw new SaleItemDoesNotBelongToSaleException(saleItemId, saleId);
                }
                throw new SaleReturnItemNotFoundException(saleItemId);
            }
        }
    }

    private void validateSaleCanBeReturned(Sale sale) {
        if (sale.getStatus() == SaleStatus.RETURNED) {
            throw new SaleReturnNotAllowedException("La venta ya fue devuelta completamente");
        }
        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new SaleReturnNotAllowedException("No se puede devolver una venta cancelada");
        }
        if (sale.getStatus() != SaleStatus.COMPLETED && sale.getStatus() != SaleStatus.PARTIALLY_RETURNED) {
            throw new SaleReturnNotAllowedException("El estado de la venta no permite devoluciones");
        }
    }

    private void validateSaleAccess(Sale sale, User user) {
        if (user.getRole() != Role.ADMIN && !sale.getCreatedBy().getId().equals(user.getId())) {
            throw new SaleAccessDeniedException();
        }
    }

    private User findActiveUser(Long userId) {
        return userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private Map<Long, SaleItem> toSaleItemMap(List<SaleItem> saleItems) {
        Map<Long, SaleItem> saleItemsById = new HashMap<>();
        for (SaleItem saleItem : saleItems) {
            saleItemsById.put(saleItem.getId(), saleItem);
        }
        return saleItemsById;
    }

    private Map<Long, Product> toProductMap(List<Product> products) {
        Map<Long, Product> productsById = new HashMap<>();
        for (Product product : products) {
            productsById.put(product.getId(), product);
        }
        return productsById;
    }

    private int getIntegerDigits(BigDecimal amount) {
        BigDecimal normalizedAmount = amount.stripTrailingZeros();
        return Math.max(normalizedAmount.precision() - normalizedAmount.scale(), 1);
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }
}
