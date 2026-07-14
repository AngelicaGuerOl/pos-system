package com.angelica.pos.receivable.payment.service;

import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.service.CashMovementService;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.receivable.entity.Receivable;
import com.angelica.pos.receivable.entity.ReceivableStatus;
import com.angelica.pos.receivable.exception.ReceivableNotFoundException;
import com.angelica.pos.receivable.payment.dto.ReceivablePaymentRequest;
import com.angelica.pos.receivable.payment.dto.ReceivablePaymentResponse;
import com.angelica.pos.receivable.payment.entity.ReceivablePayment;
import com.angelica.pos.receivable.payment.exception.ReceivableAlreadyPaidException;
import com.angelica.pos.receivable.payment.exception.ReceivableCancelledException;
import com.angelica.pos.receivable.payment.exception.ReceivablePaymentExceedsBalanceException;
import com.angelica.pos.receivable.payment.exception.ReceivablePaymentNotFoundException;
import com.angelica.pos.receivable.payment.mapper.ReceivablePaymentMapper;
import com.angelica.pos.receivable.payment.repository.ReceivablePaymentRepository;
import com.angelica.pos.receivable.repository.ReceivableRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
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
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReceivablePaymentServiceImpl implements ReceivablePaymentService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_AMOUNT_INTEGER_DIGITS = 10;
    private static final int MAX_AMOUNT_SCALE = 2;

    private final ReceivablePaymentRepository receivablePaymentRepository;
    private final ReceivableRepository receivableRepository;
    private final CashSessionRepository cashSessionRepository;
    private final UserRepository userRepository;
    private final CashMovementService cashMovementService;
    private final ReceivablePaymentMapper receivablePaymentMapper;

    @Override
    @Transactional
    public ReceivablePaymentResponse create(
            Long receivableId,
            ReceivablePaymentRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        validateRequest(request);

        Long userId = authenticatedUser.getId();
        User user = userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        CashSession cashSession = cashSessionRepository.findByOpenedByIdAndStatus(userId, CashSessionStatus.OPEN)
                .orElseThrow(OpenCashSessionRequiredException::new);
        Receivable receivable = receivableRepository.findByIdForUpdate(receivableId)
                .orElseThrow(() -> new ReceivableNotFoundException(receivableId));

        validateReceivableCanReceivePayment(receivable, request.getAmount());

        BigDecimal paidAmount = receivable.getPaidAmount().add(request.getAmount());
        BigDecimal outstandingBalance = receivable.getOriginalAmount().subtract(paidAmount);
        receivable.setPaidAmount(paidAmount);
        receivable.setOutstandingBalance(outstandingBalance);

        if (outstandingBalance.compareTo(BigDecimal.ZERO) == 0) {
            receivable.setStatus(ReceivableStatus.PAID);
            receivable.setPaidAt(OffsetDateTime.now());
        } else {
            receivable.setStatus(ReceivableStatus.PARTIALLY_PAID);
            receivable.setPaidAt(null);
        }

        ReceivablePayment payment = ReceivablePayment.builder()
                .receivable(receivable)
                .cashSession(cashSession)
                .receivedBy(user)
                .amount(request.getAmount())
                .notes(normalizeNotes(request.getNotes()))
                .build();

        ReceivablePayment savedPayment = receivablePaymentRepository.saveAndFlush(payment);
        cashMovementService.registerReceivablePayment(
                cashSession,
                user,
                savedPayment.getAmount(),
                savedPayment.getId()
        );

        return receivablePaymentMapper.toResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReceivablePaymentResponse> findByReceivable(Long receivableId, Pageable pageable) {
        validatePageSize(pageable);
        if (!receivableRepository.existsById(receivableId)) {
            throw new ReceivableNotFoundException(receivableId);
        }

        Page<ReceivablePayment> paymentsPage = receivablePaymentRepository.findByReceivableId(receivableId, pageable);
        return toPageResponse(paymentsPage);
    }

    @Override
    @Transactional(readOnly = true)
    public ReceivablePaymentResponse findById(Long id) {
        ReceivablePayment payment = receivablePaymentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ReceivablePaymentNotFoundException(id));

        return receivablePaymentMapper.toResponse(payment);
    }

    private void validateRequest(ReceivablePaymentRequest request) {
        if (request.getAmount() == null) {
            throw new IllegalArgumentException("El monto es obligatorio");
        }
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El monto debe ser mayor que cero");
        }
        if (request.getAmount().stripTrailingZeros().scale() > MAX_AMOUNT_SCALE) {
            throw new IllegalArgumentException("El monto debe tener hasta 2 decimales");
        }
        if (getIntegerDigits(request.getAmount()) > MAX_AMOUNT_INTEGER_DIGITS) {
            throw new IllegalArgumentException("El monto debe tener hasta 10 enteros");
        }
        if (request.getNotes() != null && request.getNotes().length() > 255) {
            throw new IllegalArgumentException("Las notas deben tener maximo 255 caracteres");
        }
    }

    private void validateReceivableCanReceivePayment(Receivable receivable, BigDecimal amount) {
        if (receivable.getStatus() == ReceivableStatus.PAID) {
            throw new ReceivableAlreadyPaidException(receivable.getId());
        }
        if (receivable.getStatus() == ReceivableStatus.CANCELLED) {
            throw new ReceivableCancelledException(receivable.getId());
        }
        if (amount.compareTo(receivable.getOutstandingBalance()) > 0) {
            throw new ReceivablePaymentExceedsBalanceException(receivable.getOutstandingBalance(), amount);
        }
    }

    private String normalizeNotes(String notes) {
        if (notes == null) {
            return null;
        }
        String trimmedNotes = notes.trim();
        return trimmedNotes.isEmpty() ? null : trimmedNotes;
    }

    private PageResponse<ReceivablePaymentResponse> toPageResponse(Page<ReceivablePayment> paymentsPage) {
        List<ReceivablePaymentResponse> content = receivablePaymentMapper.toResponseList(paymentsPage.getContent());

        return PageResponse.<ReceivablePaymentResponse>builder()
                .content(content)
                .page(paymentsPage.getNumber())
                .size(paymentsPage.getSize())
                .totalElements(paymentsPage.getTotalElements())
                .totalPages(paymentsPage.getTotalPages())
                .first(paymentsPage.isFirst())
                .last(paymentsPage.isLast())
                .build();
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private int getIntegerDigits(BigDecimal amount) {
        BigDecimal normalizedAmount = amount.stripTrailingZeros();
        return Math.max(normalizedAmount.precision() - normalizedAmount.scale(), 1);
    }
}
