package com.angelica.pos.sale.service;

import com.angelica.pos.cash.movement.entity.CashMovement;
import com.angelica.pos.cash.movement.entity.CashMovementDirection;
import com.angelica.pos.cash.movement.entity.CashMovementType;
import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.mapper.CashMovementMapper;
import com.angelica.pos.cash.movement.repository.CashMovementRepository;
import com.angelica.pos.cash.movement.service.CashMovementServiceImpl;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.catalog.product.exception.ProductNotFoundException;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.customer.exception.CustomerNotFoundException;
import com.angelica.pos.customer.repository.CustomerRepository;
import com.angelica.pos.inventory.movement.entity.InventoryMovement;
import com.angelica.pos.inventory.movement.entity.InventoryMovementDirection;
import com.angelica.pos.inventory.movement.entity.InventoryMovementType;
import com.angelica.pos.inventory.movement.exception.InsufficientStockException;
import com.angelica.pos.inventory.movement.mapper.InventoryMovementMapper;
import com.angelica.pos.inventory.movement.repository.InventoryMovementRepository;
import com.angelica.pos.inventory.movement.service.InventoryMovementServiceImpl;
import com.angelica.pos.sale.dto.SaleItemRequest;
import com.angelica.pos.sale.dto.SaleRequest;
import com.angelica.pos.sale.dto.SaleResponse;
import com.angelica.pos.sale.entity.Sale;
import com.angelica.pos.sale.entity.SaleItem;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.sale.exception.CreditSaleNotAvailableException;
import com.angelica.pos.sale.exception.InsufficientCashReceivedException;
import com.angelica.pos.sale.exception.SaleAccessDeniedException;
import com.angelica.pos.sale.exception.SaleNotFoundException;
import com.angelica.pos.sale.mapper.SaleMapper;
import com.angelica.pos.sale.repository.SaleRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SaleServiceImplTest {

    private SaleRepository saleRepository;
    private ProductRepository productRepository;
    private UserRepository userRepository;
    private CustomerRepository customerRepository;
    private CashSessionRepository cashSessionRepository;
    private InventoryMovementRepository inventoryMovementRepository;
    private CashMovementRepository cashMovementRepository;
    private SaleMapper saleMapper;
    private SaleServiceImpl saleService;

    @BeforeEach
    void setUp() {
        saleRepository = mock(SaleRepository.class);
        productRepository = mock(ProductRepository.class);
        userRepository = mock(UserRepository.class);
        customerRepository = mock(CustomerRepository.class);
        cashSessionRepository = mock(CashSessionRepository.class);
        inventoryMovementRepository = mock(InventoryMovementRepository.class);
        cashMovementRepository = mock(CashMovementRepository.class);
        saleMapper = mock(SaleMapper.class);

        InventoryMovementServiceImpl inventoryMovementService = new InventoryMovementServiceImpl(
                inventoryMovementRepository,
                productRepository,
                userRepository,
                mock(InventoryMovementMapper.class)
        );
        CashMovementServiceImpl cashMovementService = new CashMovementServiceImpl(
                cashMovementRepository,
                cashSessionRepository,
                userRepository,
                mock(CashMovementMapper.class)
        );
        saleService = new SaleServiceImpl(
                saleRepository,
                productRepository,
                userRepository,
                customerRepository,
                cashSessionRepository,
                inventoryMovementService,
                cashMovementService,
                saleMapper
        );
    }

    @Test
    void validCashSaleCalculatesTotalsGroupsItemsAndCreatesMovements() {
        User user = buildUser(5L, Role.CASHIER);
        CashSession cashSession = buildCashSession(11L, user);
        Customer customer = buildCustomer(8L);
        Product product = buildProduct(1L, "Cafe", "10.00", "70.00", "45.00", true);
        SaleRequest request = request(SaleType.CASH, "400.00", 8L,
                item(1L, "1.00"),
                item(1L, "1.50")
        );
        SaleResponse response = new SaleResponse();
        response.setId(99L);
        response.setTotal(new BigDecimal("175.0000"));
        response.setChangeAmount(new BigDecimal("225.0000"));

        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(cashSession));
        when(customerRepository.findByIdAndActiveTrue(customer.getId())).thenReturn(Optional.of(customer));
        when(productRepository.findAllActiveByIdInForUpdate(List.of(1L))).thenReturn(List.of(product));
        when(saleRepository.saveAndFlush(any(Sale.class))).thenAnswer(invocation -> assignIds(invocation.getArgument(0)));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cashMovementRepository.save(any(CashMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(saleMapper.toResponse(any(Sale.class))).thenReturn(response);

        SaleResponse result = saleService.create(request, new AuthenticatedUser(user));

        assertEquals(99L, result.getId());
        assertEquals(new BigDecimal("7.50"), product.getCurrentStock());
        verify(saleRepository).saveAndFlush(org.mockito.ArgumentMatchers.argThat(sale ->
                sale.getCustomer() == customer
                        && sale.getSaleType() == SaleType.CASH
                        && sale.getStatus() == SaleStatus.COMPLETED
                        && sale.getTotal().compareTo(new BigDecimal("175.0000")) == 0
                        && sale.getChangeAmount().compareTo(new BigDecimal("225.0000")) == 0
                        && sale.getItems().size() == 1
                        && sale.getItems().get(0).getQuantity().compareTo(new BigDecimal("2.50")) == 0
                        && sale.getItems().get(0).getUnitPrice().compareTo(new BigDecimal("70.00")) == 0
                        && sale.getItems().get(0).getUnitCost().compareTo(new BigDecimal("45.00")) == 0
        ));
        verify(inventoryMovementRepository).save(org.mockito.ArgumentMatchers.argThat(movement ->
                movement.getDirection() == InventoryMovementDirection.OUT
                        && movement.getType() == InventoryMovementType.SALE
                        && movement.getSourceType().equals("SALE_ITEM")
                        && movement.getSourceId().equals(1000L)
                        && movement.getQuantity().compareTo(new BigDecimal("2.50")) == 0
        ));
        verify(cashMovementRepository).save(org.mockito.ArgumentMatchers.argThat(movement ->
                movement.getDirection() == CashMovementDirection.INFLOW
                        && movement.getType() == CashMovementType.CASH_SALE
                        && movement.getSourceType().equals("SALE")
                        && movement.getSourceId().equals(99L)
                        && movement.getAmount().compareTo(new BigDecimal("175.0000")) == 0
        ));
    }

    @Test
    void validSaleAllowsOptionalCustomer() {
        User user = buildUser(5L, Role.CASHIER);
        Product product = buildProduct(1L, "Cafe", "10.00", "70.00", "45.00", true);

        mockSuccessfulBase(user, product);
        when(saleMapper.toResponse(any(Sale.class))).thenReturn(new SaleResponse());

        saleService.create(request(SaleType.CASH, "100.00", null, item(1L, "1.00")), new AuthenticatedUser(user));

        verify(customerRepository, never()).findByIdAndActiveTrue(any());
        verify(saleRepository).saveAndFlush(org.mockito.ArgumentMatchers.argThat(sale -> sale.getCustomer() == null));
    }

    @Test
    void saleWithoutOpenCashSessionIsRejected() {
        User user = buildUser(5L, Role.CASHIER);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        assertThrows(
                OpenCashSessionRequiredException.class,
                () -> saleService.create(request(SaleType.CASH, "100.00", null, item(1L, "1.00")), new AuthenticatedUser(user))
        );
    }

    @Test
    void emptyItemListIsRejected() {
        User user = buildUser(5L, Role.CASHIER);
        SaleRequest request = request(SaleType.CASH, "100.00", null);

        assertThrows(
                IllegalArgumentException.class,
                () -> saleService.create(request, new AuthenticatedUser(user))
        );
    }

    @Test
    void invalidQuantityIsRejected() {
        User user = buildUser(5L, Role.CASHIER);

        assertThrows(
                IllegalArgumentException.class,
                () -> saleService.create(
                        request(SaleType.CASH, "100.00", null, item(1L, "1.001")),
                        new AuthenticatedUser(user)
                )
        );
    }

    @Test
    void missingOrInactiveProductIsRejected() {
        User user = buildUser(5L, Role.CASHIER);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(buildCashSession(11L, user)));
        when(productRepository.findAllActiveByIdInForUpdate(List.of(1L))).thenReturn(List.of());

        assertThrows(
                ProductNotFoundException.class,
                () -> saleService.create(request(SaleType.CASH, "100.00", null, item(1L, "1.00")), new AuthenticatedUser(user))
        );
    }

    @Test
    void inactiveCustomerIsRejected() {
        User user = buildUser(5L, Role.CASHIER);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(buildCashSession(11L, user)));
        when(customerRepository.findByIdAndActiveTrue(8L)).thenReturn(Optional.empty());

        assertThrows(
                CustomerNotFoundException.class,
                () -> saleService.create(request(SaleType.CASH, "100.00", 8L, item(1L, "1.00")), new AuthenticatedUser(user))
        );
    }

    @Test
    void insufficientStockIsRejectedBeforePersistingAnything() {
        User user = buildUser(5L, Role.CASHIER);
        Product first = buildProduct(1L, "Cafe", "10.00", "70.00", "45.00", true);
        Product second = buildProduct(2L, "Azucar", "1.00", "30.00", "20.00", true);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(buildCashSession(11L, user)));
        when(productRepository.findAllActiveByIdInForUpdate(List.of(1L, 2L))).thenReturn(List.of(first, second));

        assertThrows(
                InsufficientStockException.class,
                () -> saleService.create(
                        request(SaleType.CASH, "500.00", null, item(1L, "2.00"), item(2L, "2.00")),
                        new AuthenticatedUser(user)
                )
        );
        assertEquals(new BigDecimal("10.00"), first.getCurrentStock());
        assertEquals(new BigDecimal("1.00"), second.getCurrentStock());
        verify(saleRepository, never()).saveAndFlush(any());
        verify(inventoryMovementRepository, never()).save(any());
        verify(cashMovementRepository, never()).save(any());
    }

    @Test
    void insufficientCashIsRejected() {
        User user = buildUser(5L, Role.CASHIER);
        Product product = buildProduct(1L, "Cafe", "10.00", "70.00", "45.00", true);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(buildCashSession(11L, user)));
        when(productRepository.findAllActiveByIdInForUpdate(List.of(1L))).thenReturn(List.of(product));

        assertThrows(
                InsufficientCashReceivedException.class,
                () -> saleService.create(request(SaleType.CASH, "50.00", null, item(1L, "1.00")), new AuthenticatedUser(user))
        );
        verify(saleRepository, never()).saveAndFlush(any());
    }

    @Test
    void creditSaleIsRejected() {
        User user = buildUser(5L, Role.CASHIER);

        assertThrows(
                CreditSaleNotAvailableException.class,
                () -> saleService.create(request(SaleType.CREDIT, "100.00", null, item(1L, "1.00")), new AuthenticatedUser(user))
        );
    }

    @Test
    void cashierCanFindOwnSaleButNotOtherCashiersSale() {
        User cashier = buildUser(5L, Role.CASHIER);
        Sale sale = Sale.builder().id(20L).createdBy(cashier).build();
        when(saleRepository.findByIdWithDetails(20L)).thenReturn(Optional.of(sale));
        when(saleMapper.toResponse(sale)).thenReturn(new SaleResponse());

        saleService.findById(20L, new AuthenticatedUser(cashier));

        User otherCashier = buildUser(6L, Role.CASHIER);
        assertThrows(
                SaleAccessDeniedException.class,
                () -> saleService.findById(20L, new AuthenticatedUser(otherCashier))
        );
    }

    @Test
    void adminFindsAnySaleAndGlobalHistory() {
        User admin = buildUser(1L, Role.ADMIN);
        User cashier = buildUser(5L, Role.CASHIER);
        Sale sale = Sale.builder().id(20L).createdBy(cashier).build();
        PageRequest pageable = PageRequest.of(0, 10);
        when(saleRepository.findByIdWithDetails(20L)).thenReturn(Optional.of(sale));
        when(saleMapper.toResponse(sale)).thenReturn(new SaleResponse());
        when(saleRepository.findAll(org.mockito.ArgumentMatchers.<Specification<Sale>>any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(sale), pageable, 1));
        when(saleMapper.toResponseList(List.of(sale))).thenReturn(List.of(new SaleResponse()));

        saleService.findById(20L, new AuthenticatedUser(admin));
        PageResponse<SaleResponse> result = saleService.findAll(null, null, null, null, null, null, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void missingSaleReturnsNotFound() {
        User user = buildUser(5L, Role.CASHIER);
        when(saleRepository.findByIdWithDetails(20L)).thenReturn(Optional.empty());

        assertThrows(SaleNotFoundException.class, () -> saleService.findById(20L, new AuthenticatedUser(user)));
    }

    private void mockSuccessfulBase(User user, Product product) {
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.of(buildCashSession(11L, user)));
        when(productRepository.findAllActiveByIdInForUpdate(List.of(product.getId()))).thenReturn(List.of(product));
        when(saleRepository.saveAndFlush(any(Sale.class))).thenAnswer(invocation -> assignIds(invocation.getArgument(0)));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cashMovementRepository.save(any(CashMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Sale assignIds(Sale sale) {
        sale.setId(99L);
        long itemId = 1000L;
        for (SaleItem item : sale.getItems()) {
            item.setId(itemId++);
        }
        return sale;
    }

    private SaleRequest request(SaleType saleType, String cashReceived, Long customerId, SaleItemRequest... items) {
        SaleRequest request = new SaleRequest();
        request.setSaleType(saleType);
        request.setCustomerId(customerId);
        request.setCashReceived(new BigDecimal(cashReceived));
        request.setItems(List.of(items));
        return request;
    }

    private SaleItemRequest item(Long productId, String quantity) {
        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(productId);
        item.setQuantity(new BigDecimal(quantity));
        return item;
    }

    private Product buildProduct(Long id, String name, String stock, String salePrice, String costPrice, Boolean active) {
        return Product.builder()
                .id(id)
                .barcode("750000000000" + id)
                .name(name)
                .unit(ProductUnit.PIECE)
                .costPrice(new BigDecimal(costPrice))
                .salePrice(new BigDecimal(salePrice))
                .currentStock(new BigDecimal(stock))
                .minimumStock(BigDecimal.ZERO)
                .active(active)
                .build();
    }

    private Customer buildCustomer(Long id) {
        return Customer.builder()
                .id(id)
                .firstName("Ana")
                .lastName("Lopez")
                .active(true)
                .build();
    }

    private CashSession buildCashSession(Long id, User user) {
        return CashSession.builder()
                .id(id)
                .openedBy(user)
                .openingAmount(BigDecimal.ZERO)
                .status(CashSessionStatus.OPEN)
                .build();
    }

    private User buildUser(Long id, Role role) {
        return User.builder()
                .id(id)
                .username("user" + id)
                .passwordHash("password-hash")
                .role(role)
                .active(true)
                .mustChangePassword(false)
                .build();
    }
}
