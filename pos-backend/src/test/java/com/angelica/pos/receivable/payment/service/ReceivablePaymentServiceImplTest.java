package com.angelica.pos.receivable.payment.service;

import com.angelica.pos.cash.movement.entity.CashMovement;
import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.service.CashMovementService;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.receivable.entity.Receivable;
import com.angelica.pos.receivable.entity.ReceivableStatus;
import com.angelica.pos.receivable.payment.dto.ReceivablePaymentRequest;
import com.angelica.pos.receivable.payment.dto.ReceivablePaymentResponse;
import com.angelica.pos.receivable.payment.entity.ReceivablePayment;
import com.angelica.pos.receivable.payment.exception.ReceivableAlreadyPaidException;
import com.angelica.pos.receivable.payment.exception.ReceivableCancelledException;
import com.angelica.pos.receivable.payment.exception.ReceivablePaymentExceedsBalanceException;
import com.angelica.pos.receivable.payment.mapper.ReceivablePaymentMapper;
import com.angelica.pos.receivable.payment.repository.ReceivablePaymentRepository;
import com.angelica.pos.receivable.repository.ReceivableRepository;
import com.angelica.pos.sale.entity.Sale;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReceivablePaymentServiceImplTest {

    private ReceivablePaymentRepository receivablePaymentRepository;
    private ReceivableRepository receivableRepository;
    private CashSessionRepository cashSessionRepository;
    private UserRepository userRepository;
    private CashMovementService cashMovementService;
    private ReceivablePaymentMapper receivablePaymentMapper;
    private ReceivablePaymentServiceImpl receivablePaymentService;

    @BeforeEach
    void setUp() {
        receivablePaymentRepository = mock(ReceivablePaymentRepository.class);
        receivableRepository = mock(ReceivableRepository.class);
        cashSessionRepository = mock(CashSessionRepository.class);
        userRepository = mock(UserRepository.class);
        cashMovementService = mock(CashMovementService.class);
        receivablePaymentMapper = mock(ReceivablePaymentMapper.class);
        receivablePaymentService = new ReceivablePaymentServiceImpl(
                receivablePaymentRepository,
                receivableRepository,
                cashSessionRepository,
                userRepository,
                cashMovementService,
                receivablePaymentMapper
        );
    }

    @Test
    void partialPaymentUpdatesReceivableAndCreatesCashMovement() {
        User user = user(5L);
        CashSession cashSession = cashSession(11L, user);
        Receivable receivable = receivable(20L, "500.00", "0.00", "500.00", ReceivableStatus.PENDING);
        ReceivablePaymentRequest request = request("300.00", " Abono semanal ");
        ReceivablePaymentResponse response = new ReceivablePaymentResponse();
        response.setId(40L);

        mockBase(user, cashSession, receivable);
        when(receivablePaymentRepository.saveAndFlush(any(ReceivablePayment.class)))
                .thenAnswer(invocation -> assignPaymentId(invocation.getArgument(0), 40L));
        when(cashMovementService.registerReceivablePayment(cashSession, user, new BigDecimal("300.00"), 40L))
                .thenReturn(new CashMovement());
        when(receivablePaymentMapper.toResponse(any(ReceivablePayment.class))).thenReturn(response);

        ReceivablePaymentResponse result = receivablePaymentService.create(
                receivable.getId(),
                request,
                new AuthenticatedUser(user)
        );

        assertEquals(response, result);
        assertEquals(new BigDecimal("300.00"), receivable.getPaidAmount());
        assertEquals(new BigDecimal("200.00"), receivable.getOutstandingBalance());
        assertEquals(ReceivableStatus.PARTIALLY_PAID, receivable.getStatus());
        verify(receivablePaymentRepository).saveAndFlush(org.mockito.ArgumentMatchers.argThat(payment ->
                payment.getReceivable() == receivable
                        && payment.getCashSession() == cashSession
                        && payment.getReceivedBy() == user
                        && payment.getAmount().compareTo(new BigDecimal("300.00")) == 0
                        && payment.getNotes().equals("Abono semanal")
        ));
        verify(cashMovementService).registerReceivablePayment(cashSession, user, new BigDecimal("300.00"), 40L);
    }

    @Test
    void totalPaymentMarksReceivableAsPaidAndSetsPaidAt() {
        User user = user(5L);
        CashSession cashSession = cashSession(11L, user);
        Receivable receivable = receivable(20L, "500.00", "200.00", "300.00", ReceivableStatus.PARTIALLY_PAID);

        mockBase(user, cashSession, receivable);
        when(receivablePaymentRepository.saveAndFlush(any(ReceivablePayment.class)))
                .thenAnswer(invocation -> assignPaymentId(invocation.getArgument(0), 41L));
        when(receivablePaymentMapper.toResponse(any(ReceivablePayment.class))).thenReturn(new ReceivablePaymentResponse());

        receivablePaymentService.create(receivable.getId(), request("300.00", null), new AuthenticatedUser(user));

        assertEquals(new BigDecimal("500.00"), receivable.getPaidAmount());
        assertEquals(BigDecimal.ZERO.setScale(2), receivable.getOutstandingBalance());
        assertEquals(ReceivableStatus.PAID, receivable.getStatus());
        assertNotNull(receivable.getPaidAt());
    }

    @Test
    void paymentGreaterThanBalanceIsRejected() {
        User user = user(5L);
        CashSession cashSession = cashSession(11L, user);
        Receivable receivable = receivable(20L, "500.00", "200.00", "300.00", ReceivableStatus.PARTIALLY_PAID);
        mockBase(user, cashSession, receivable);

        assertThrows(
                ReceivablePaymentExceedsBalanceException.class,
                () -> receivablePaymentService.create(receivable.getId(), request("300.01", null), new AuthenticatedUser(user))
        );
        verify(receivablePaymentRepository, never()).saveAndFlush(any());
        verify(cashMovementService, never()).registerReceivablePayment(any(), any(), any(), any());
    }

    @Test
    void paidOrCancelledReceivableIsRejected() {
        User user = user(5L);
        CashSession cashSession = cashSession(11L, user);
        Receivable paid = receivable(20L, "500.00", "500.00", "0.00", ReceivableStatus.PAID);
        mockBase(user, cashSession, paid);

        assertThrows(
                ReceivableAlreadyPaidException.class,
                () -> receivablePaymentService.create(paid.getId(), request("1.00", null), new AuthenticatedUser(user))
        );

        Receivable cancelled = receivable(21L, "500.00", "0.00", "500.00", ReceivableStatus.CANCELLED);
        when(receivableRepository.findByIdForUpdate(cancelled.getId())).thenReturn(Optional.of(cancelled));

        assertThrows(
                ReceivableCancelledException.class,
                () -> receivablePaymentService.create(cancelled.getId(), request("1.00", null), new AuthenticatedUser(user))
        );
    }

    @Test
    void paymentWithoutOpenCashSessionIsRejected() {
        User user = user(5L);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        assertThrows(
                OpenCashSessionRequiredException.class,
                () -> receivablePaymentService.create(20L, request("100.00", null), new AuthenticatedUser(user))
        );
        verify(receivableRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void cashMovementFailurePropagatesInsidePaymentTransaction() {
        User user = user(5L);
        CashSession cashSession = cashSession(11L, user);
        Receivable receivable = receivable(20L, "500.00", "0.00", "500.00", ReceivableStatus.PENDING);
        mockBase(user, cashSession, receivable);
        when(receivablePaymentRepository.saveAndFlush(any(ReceivablePayment.class)))
                .thenAnswer(invocation -> assignPaymentId(invocation.getArgument(0), 40L));
        doThrow(new IllegalStateException("cash movement failure"))
                .when(cashMovementService).registerReceivablePayment(cashSession, user, new BigDecimal("100.00"), 40L);

        assertThrows(
                IllegalStateException.class,
                () -> receivablePaymentService.create(receivable.getId(), request("100.00", null), new AuthenticatedUser(user))
        );
    }

    @Test
    void receivableRepositoryUsesPessimisticWriteLockForPaymentConcurrency() throws NoSuchMethodException {
        Method method = ReceivableRepository.class.getMethod("findByIdForUpdate", Long.class);
        Lock lock = method.getAnnotation(Lock.class);

        assertNotNull(lock);
        assertEquals(LockModeType.PESSIMISTIC_WRITE, lock.value());
    }

    private void mockBase(User user, CashSession cashSession, Receivable receivable) {
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(receivableRepository.findByIdForUpdate(receivable.getId())).thenReturn(Optional.of(receivable));
    }

    private ReceivablePayment assignPaymentId(ReceivablePayment payment, Long id) {
        payment.setId(id);
        return payment;
    }

    private ReceivablePaymentRequest request(String amount, String notes) {
        ReceivablePaymentRequest request = new ReceivablePaymentRequest();
        request.setAmount(new BigDecimal(amount));
        request.setNotes(notes);
        return request;
    }

    private Receivable receivable(
            Long id,
            String originalAmount,
            String paidAmount,
            String outstandingBalance,
            ReceivableStatus status
    ) {
        Customer customer = Customer.builder()
                .id(8L)
                .firstName("Ana")
                .lastName("Lopez")
                .active(true)
                .build();
        Sale sale = Sale.builder()
                .id(30L)
                .customer(customer)
                .total(new BigDecimal(originalAmount))
                .build();
        return Receivable.builder()
                .id(id)
                .sale(sale)
                .customer(customer)
                .originalAmount(new BigDecimal(originalAmount))
                .paidAmount(new BigDecimal(paidAmount))
                .outstandingBalance(new BigDecimal(outstandingBalance))
                .status(status)
                .build();
    }

    private CashSession cashSession(Long id, User user) {
        return CashSession.builder()
                .id(id)
                .openedBy(user)
                .openingAmount(BigDecimal.ZERO)
                .status(CashSessionStatus.OPEN)
                .build();
    }

    private User user(Long id) {
        return User.builder()
                .id(id)
                .username("user" + id)
                .passwordHash("password-hash")
                .role(Role.CASHIER)
                .active(true)
                .mustChangePassword(false)
                .build();
    }
}
