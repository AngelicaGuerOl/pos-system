package com.angelica.pos.sale.cancellation.service;

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
import com.angelica.pos.receivable.payment.repository.ReceivablePaymentRepository;
import com.angelica.pos.receivable.repository.ReceivableRepository;
import com.angelica.pos.sale.cancellation.dto.SaleCancellationRequest;
import com.angelica.pos.sale.cancellation.dto.SaleCancellationResponse;
import com.angelica.pos.sale.cancellation.entity.SaleCancellation;
import com.angelica.pos.sale.cancellation.exception.CreditSaleWithPaymentsCancellationException;
import com.angelica.pos.sale.cancellation.exception.SaleAlreadyCancelledException;
import com.angelica.pos.sale.cancellation.exception.SaleCancellationNotAllowedException;
import com.angelica.pos.sale.cancellation.mapper.SaleCancellationMapper;
import com.angelica.pos.sale.cancellation.repository.SaleCancellationRepository;
import com.angelica.pos.sale.entity.Sale;
import com.angelica.pos.sale.entity.SaleItem;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.sale.exception.SaleAccessDeniedException;
import com.angelica.pos.sale.exception.SaleNotFoundException;
import com.angelica.pos.sale.repository.SaleRepository;
import com.angelica.pos.sale.returning.exception.CreditSaleReceivableRequiredException;
import com.angelica.pos.sale.returning.repository.SaleReturnRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SaleCancellationServiceImpl implements SaleCancellationService {

    private final SaleCancellationRepository saleCancellationRepository;
    private final SaleRepository saleRepository;
    private final SaleReturnRepository saleReturnRepository;
    private final ReceivableRepository receivableRepository;
    private final ReceivablePaymentRepository receivablePaymentRepository;
    private final ProductRepository productRepository;
    private final CashSessionRepository cashSessionRepository;
    private final UserRepository userRepository;
    private final InventoryMovementService inventoryMovementService;
    private final CashMovementService cashMovementService;
    private final SaleCancellationMapper saleCancellationMapper;

    @Override
    @Transactional
    public SaleCancellationResponse cancel(
            Long saleId,
            SaleCancellationRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        String reason = normalizeReason(request);
        User user = findActiveUser(authenticatedUser.getId());
        Sale sale = saleRepository.findByIdForReturnUpdate(saleId)
                .orElseThrow(() -> new SaleNotFoundException(saleId));

        validateSaleAccess(sale, user);
        validateSaleCanBeCancelled(sale);
        validateNoCancellationExists(sale.getId());
        validateNoReturns(sale.getId());

        Map<Long, Product> productsById = lockProducts(sale);

        CashSession cashSession = null;
        BigDecimal refundAmount = BigDecimal.ZERO;
        Receivable receivable = null;
        if (sale.getSaleType() == SaleType.CASH) {
            cashSession = cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN)
                    .orElseThrow(OpenCashSessionRequiredException::new);
            refundAmount = sale.getTotal();
        } else {
            validateCreditSaleHasNoPayments(sale.getId());
            receivable = receivableRepository.findBySaleIdForUpdate(sale.getId())
                    .orElseThrow(() -> new CreditSaleReceivableRequiredException(sale.getId()));
        }

        SaleCancellation cancellation = SaleCancellation.builder()
                .sale(sale)
                .cashSession(cashSession)
                .cancelledBy(user)
                .reason(reason)
                .refundAmount(refundAmount)
                .build();
        SaleCancellation savedCancellation = saleCancellationRepository.saveAndFlush(cancellation);

        for (SaleItem item : sale.getItems()) {
            Product product = productsById.get(item.getProduct().getId());
            inventoryMovementService.registerSaleCancellationMovement(
                    product,
                    item.getQuantity(),
                    savedCancellation.getId(),
                    user
            );
        }

        if (sale.getSaleType() == SaleType.CASH) {
            cashMovementService.registerSaleCancellationRefund(
                    cashSession,
                    user,
                    refundAmount,
                    savedCancellation.getId()
            );
        } else {
            cancelReceivable(receivable);
        }

        sale.setStatus(SaleStatus.CANCELLED);
        sale.setCancelledAt(OffsetDateTime.now());
        return saleCancellationMapper.toResponse(savedCancellation);
    }

    private String normalizeReason(SaleCancellationRequest request) {
        if (request == null || request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Reason is required");
        }
        String reason = request.getReason().trim();
        if (reason.length() > 255) {
            throw new IllegalArgumentException("Reason must have at most 255 characters");
        }
        return reason;
    }

    private User findActiveUser(Long userId) {
        return userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private void validateSaleAccess(Sale sale, User user) {
        if (user.getRole() != Role.ADMIN && !sale.getCreatedBy().getId().equals(user.getId())) {
            throw new SaleAccessDeniedException();
        }
    }

    private void validateSaleCanBeCancelled(Sale sale) {
        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new SaleAlreadyCancelledException(sale.getId());
        }
        if (sale.getStatus() == SaleStatus.PARTIALLY_RETURNED || sale.getStatus() == SaleStatus.RETURNED) {
            throw new SaleCancellationNotAllowedException(
                    "No se puede cancelar una venta con devoluciones. Debe realizarse una devolucion total."
            );
        }
        if (sale.getStatus() != SaleStatus.COMPLETED) {
            throw new SaleCancellationNotAllowedException("El estado de la venta no permite cancelacion");
        }
    }

    private void validateNoCancellationExists(Long saleId) {
        if (saleCancellationRepository.existsBySaleId(saleId)) {
            throw new SaleAlreadyCancelledException(saleId);
        }
    }

    private void validateNoReturns(Long saleId) {
        if (saleReturnRepository.existsBySaleId(saleId)) {
            throw new SaleCancellationNotAllowedException(
                    "No se puede cancelar una venta con devoluciones. Debe realizarse una devolucion total."
            );
        }
    }

    private void validateCreditSaleHasNoPayments(Long saleId) {
        if (receivablePaymentRepository.existsBySaleId(saleId)) {
            throw new CreditSaleWithPaymentsCancellationException(saleId);
        }
    }

    private Map<Long, Product> lockProducts(Sale sale) {
        List<Long> orderedProductIds = sale.getItems().stream()
                .map(item -> item.getProduct().getId())
                .distinct()
                .sorted()
                .toList();
        List<Product> products = productRepository.findAllByIdInForUpdate(orderedProductIds);
        Map<Long, Product> productsById = new HashMap<>();
        for (Product product : products) {
            productsById.put(product.getId(), product);
        }
        return productsById;
    }

    private void cancelReceivable(Receivable receivable) {
        receivable.setReturnedAmount(receivable.getOriginalAmount());
        receivable.setAdjustedAmount(BigDecimal.ZERO);
        receivable.setPaidAmount(BigDecimal.ZERO);
        receivable.setOutstandingBalance(BigDecimal.ZERO);
        receivable.setStatus(ReceivableStatus.CANCELLED);
        receivable.setPaidAt(null);
    }
}
