package com.angelica.pos.sale.cancellation.service;

import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.service.CashMovementService;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.receivable.entity.Receivable;
import com.angelica.pos.receivable.entity.ReceivableStatus;
import com.angelica.pos.receivable.payment.repository.ReceivablePaymentRepository;
import com.angelica.pos.receivable.repository.ReceivableRepository;
import com.angelica.pos.sale.cancellation.dto.SaleCancellationRequest;
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
import com.angelica.pos.sale.exception.SaleNotFoundException;
import com.angelica.pos.sale.repository.SaleRepository;
import com.angelica.pos.sale.returning.repository.SaleReturnRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SaleCancellationServiceImplTest {

    private SaleCancellationRepository saleCancellationRepository;
    private SaleRepository saleRepository;
    private SaleReturnRepository saleReturnRepository;
    private ReceivableRepository receivableRepository;
    private ReceivablePaymentRepository receivablePaymentRepository;
    private ProductRepository productRepository;
    private CashSessionRepository cashSessionRepository;
    private UserRepository userRepository;
    private InventoryMovementService inventoryMovementService;
    private CashMovementService cashMovementService;
    private SaleCancellationServiceImpl saleCancellationService;

    @BeforeEach
    void setUp() {
        saleCancellationRepository = mock(SaleCancellationRepository.class);
        saleRepository = mock(SaleRepository.class);
        saleReturnRepository = mock(SaleReturnRepository.class);
        receivableRepository = mock(ReceivableRepository.class);
        receivablePaymentRepository = mock(ReceivablePaymentRepository.class);
        productRepository = mock(ProductRepository.class);
        cashSessionRepository = mock(CashSessionRepository.class);
        userRepository = mock(UserRepository.class);
        inventoryMovementService = mock(InventoryMovementService.class);
        cashMovementService = mock(CashMovementService.class);

        saleCancellationService = new SaleCancellationServiceImpl(
                saleCancellationRepository,
                saleRepository,
                saleReturnRepository,
                receivableRepository,
                receivablePaymentRepository,
                productRepository,
                cashSessionRepository,
                userRepository,
                inventoryMovementService,
                cashMovementService,
                mock(SaleCancellationMapper.class)
        );
    }

    @Test
    void cashSaleCancellationRestoresInventoryAndCreatesRefund() {
        User user = user(Role.CASHIER);
        Product product = product();
        Sale sale = sale(SaleType.CASH, SaleStatus.COMPLETED, user, product);
        CashSession cashSession = cashSession(user);
        SaleCancellationRequest request = request(" Venta duplicada ");

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(saleRepository.findByIdForReturnUpdate(sale.getId())).thenReturn(Optional.of(sale));
        when(saleCancellationRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(saleReturnRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(productRepository.findAllByIdInForUpdate(List.of(product.getId()))).thenReturn(List.of(product));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(saleCancellationRepository.saveAndFlush(any(SaleCancellation.class))).thenAnswer(invocation -> {
            SaleCancellation cancellation = invocation.getArgument(0);
            cancellation.setId(90L);
            return cancellation;
        });

        saleCancellationService.cancel(sale.getId(), request, new AuthenticatedUser(user));

        assertEquals(SaleStatus.CANCELLED, sale.getStatus());
        verify(inventoryMovementService).registerSaleCancellationMovement(
                eq(product),
                eq(new BigDecimal("2.00")),
                eq(90L),
                eq(user)
        );
        verify(cashMovementService).registerSaleCancellationRefund(
                eq(cashSession),
                eq(user),
                eq(new BigDecimal("120.00")),
                eq(90L)
        );
        verify(saleCancellationRepository).saveAndFlush(org.mockito.ArgumentMatchers.argThat(cancellation ->
                cancellation.getReason().equals("Venta duplicada")
                        && cancellation.getRefundAmount().compareTo(new BigDecimal("120.00")) == 0
                        && cancellation.getCashSession() == cashSession
        ));
    }

    @Test
    void creditSaleCancellationCancelsReceivableWithoutCashMovement() {
        User user = user(Role.ADMIN);
        Product product = product();
        Sale sale = sale(SaleType.CREDIT, SaleStatus.COMPLETED, user, product);
        CashSession cashSession = cashSession(user);
        Receivable receivable = receivable(sale);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(saleRepository.findByIdForReturnUpdate(sale.getId())).thenReturn(Optional.of(sale));
        when(saleCancellationRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(saleReturnRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(productRepository.findAllByIdInForUpdate(List.of(product.getId()))).thenReturn(List.of(product));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(receivablePaymentRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(receivableRepository.findBySaleIdForUpdate(sale.getId())).thenReturn(Optional.of(receivable));
        when(saleCancellationRepository.saveAndFlush(any(SaleCancellation.class))).thenAnswer(invocation -> {
            SaleCancellation cancellation = invocation.getArgument(0);
            cancellation.setId(91L);
            return cancellation;
        });

        saleCancellationService.cancel(sale.getId(), request("Credito duplicado"), new AuthenticatedUser(user));

        assertEquals(SaleStatus.CANCELLED, sale.getStatus());
        assertEquals(ReceivableStatus.CANCELLED, receivable.getStatus());
        assertEquals(BigDecimal.ZERO, receivable.getAdjustedAmount());
        assertEquals(BigDecimal.ZERO, receivable.getPaidAmount());
        assertEquals(BigDecimal.ZERO, receivable.getOutstandingBalance());
        assertNull(receivable.getPaidAt());
        verify(cashMovementService, never()).registerSaleCancellationRefund(any(), any(), any(), any());
        verify(saleCancellationRepository).saveAndFlush(org.mockito.ArgumentMatchers.argThat(cancellation ->
                cancellation.getRefundAmount().compareTo(BigDecimal.ZERO) == 0
                        && cancellation.getCashSession() == cashSession
        ));
    }

    @Test
    void rejectsSaleWithReturns() {
        User user = user(Role.ADMIN);
        Product product = product();
        Sale sale = sale(SaleType.CASH, SaleStatus.COMPLETED, user, product);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(saleRepository.findByIdForReturnUpdate(sale.getId())).thenReturn(Optional.of(sale));
        when(saleCancellationRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(saleReturnRepository.existsBySaleId(sale.getId())).thenReturn(true);

        assertThrows(SaleCancellationNotAllowedException.class,
                () -> saleCancellationService.cancel(sale.getId(), request("Duplicada"), new AuthenticatedUser(user)));
    }

    @Test
    void rejectsCreditSaleWithPayments() {
        User user = user(Role.ADMIN);
        Product product = product();
        Sale sale = sale(SaleType.CREDIT, SaleStatus.COMPLETED, user, product);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(saleRepository.findByIdForReturnUpdate(sale.getId())).thenReturn(Optional.of(sale));
        when(saleCancellationRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(saleReturnRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(productRepository.findAllByIdInForUpdate(List.of(product.getId()))).thenReturn(List.of(product));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession(user)));
        when(receivablePaymentRepository.existsBySaleId(sale.getId())).thenReturn(true);

        assertThrows(CreditSaleWithPaymentsCancellationException.class,
                () -> saleCancellationService.cancel(sale.getId(), request("Duplicada"), new AuthenticatedUser(user)));
    }

    @Test
    void rejectsSecondCancellation() {
        User user = user(Role.ADMIN);
        Product product = product();
        Sale sale = sale(SaleType.CASH, SaleStatus.CANCELLED, user, product);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(saleRepository.findByIdForReturnUpdate(sale.getId())).thenReturn(Optional.of(sale));

        assertThrows(SaleAlreadyCancelledException.class,
                () -> saleCancellationService.cancel(sale.getId(), request("Duplicada"), new AuthenticatedUser(user)));
    }

    @Test
    void rejectsCashCancellationWithoutOpenCashSession() {
        User user = user(Role.ADMIN);
        Product product = product();
        Sale sale = sale(SaleType.CASH, SaleStatus.COMPLETED, user, product);

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(saleRepository.findByIdForReturnUpdate(sale.getId())).thenReturn(Optional.of(sale));
        when(saleCancellationRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(saleReturnRepository.existsBySaleId(sale.getId())).thenReturn(false);
        when(productRepository.findAllByIdInForUpdate(List.of(product.getId()))).thenReturn(List.of(product));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        assertThrows(OpenCashSessionRequiredException.class,
                () -> saleCancellationService.cancel(sale.getId(), request("Duplicada"), new AuthenticatedUser(user)));
    }

    @Test
    void rejectsMissingSale() {
        User user = user(Role.ADMIN);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(saleRepository.findByIdForReturnUpdate(99L)).thenReturn(Optional.empty());

        assertThrows(SaleNotFoundException.class,
                () -> saleCancellationService.cancel(99L, request("Duplicada"), new AuthenticatedUser(user)));
    }

    private SaleCancellationRequest request(String reason) {
        SaleCancellationRequest request = new SaleCancellationRequest();
        request.setReason(reason);
        return request;
    }

    private User user(Role role) {
        return User.builder()
                .id(5L)
                .username("admin")
                .passwordHash("hash")
                .role(role)
                .active(true)
                .mustChangePassword(false)
                .build();
    }

    private CashSession cashSession(User user) {
        return CashSession.builder()
                .id(30L)
                .openedBy(user)
                .status(CashSessionStatus.OPEN)
                .openingAmount(BigDecimal.ZERO)
                .build();
    }

    private Product product() {
        return Product.builder()
                .id(10L)
                .name("Cafe")
                .barcode("123")
                .unit(ProductUnit.PIECE)
                .costPrice(new BigDecimal("40.00"))
                .salePrice(new BigDecimal("60.00"))
                .currentStock(new BigDecimal("5.00"))
                .minimumStock(BigDecimal.ZERO)
                .active(true)
                .build();
    }

    private Sale sale(SaleType saleType, SaleStatus status, User user, Product product) {
        Sale sale = Sale.builder()
                .id(20L)
                .createdBy(user)
                .saleType(saleType)
                .status(status)
                .total(new BigDecimal("120.00"))
                .build();
        sale.addItem(SaleItem.builder()
                .id(25L)
                .product(product)
                .productName(product.getName())
                .productBarcode(product.getBarcode())
                .productUnit(product.getUnit())
                .quantity(new BigDecimal("2.00"))
                .returnedQuantity(BigDecimal.ZERO)
                .unitPrice(new BigDecimal("60.00"))
                .unitCost(new BigDecimal("40.00"))
                .lineTotal(new BigDecimal("120.00"))
                .build());
        return sale;
    }

    private Receivable receivable(Sale sale) {
        return Receivable.builder()
                .id(40L)
                .sale(sale)
                .originalAmount(new BigDecimal("120.00"))
                .returnedAmount(BigDecimal.ZERO)
                .adjustedAmount(new BigDecimal("120.00"))
                .paidAmount(BigDecimal.ZERO)
                .outstandingBalance(new BigDecimal("120.00"))
                .status(ReceivableStatus.PENDING)
                .build();
    }
}
