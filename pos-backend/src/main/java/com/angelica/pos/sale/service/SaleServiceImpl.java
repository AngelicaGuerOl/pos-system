package com.angelica.pos.sale.service;

import com.angelica.pos.cash.movement.exception.OpenCashSessionRequiredException;
import com.angelica.pos.cash.movement.service.CashMovementService;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.exception.ProductNotFoundException;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.customer.exception.CustomerNotFoundException;
import com.angelica.pos.customer.repository.CustomerRepository;
import com.angelica.pos.inventory.movement.exception.InsufficientStockException;
import com.angelica.pos.inventory.movement.service.InventoryMovementService;
import com.angelica.pos.receivable.service.ReceivableService;
import com.angelica.pos.sale.dto.SaleDetailResponse;
import com.angelica.pos.sale.dto.SaleItemRequest;
import com.angelica.pos.sale.dto.SaleRequest;
import com.angelica.pos.sale.dto.SaleResponse;
import com.angelica.pos.sale.dto.SaleSummaryResponse;
import com.angelica.pos.sale.entity.Sale;
import com.angelica.pos.sale.entity.SaleItem;
import com.angelica.pos.sale.entity.SaleStatus;
import com.angelica.pos.sale.entity.SaleType;
import com.angelica.pos.sale.exception.CreditSaleCashReceivedNotAllowedException;
import com.angelica.pos.sale.exception.CreditSaleCustomerRequiredException;
import com.angelica.pos.sale.exception.InsufficientCashReceivedException;
import com.angelica.pos.sale.exception.SaleAccessDeniedException;
import com.angelica.pos.sale.exception.SaleNotFoundException;
import com.angelica.pos.sale.mapper.SaleMapper;
import com.angelica.pos.sale.repository.SaleRepository;
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
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SaleServiceImpl implements SaleService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_LINES = 100;
    private static final int MAX_QUANTITY_INTEGER_DIGITS = 8;
    private static final int MAX_AMOUNT_INTEGER_DIGITS = 10;
    private static final int MAX_SCALE = 2;

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final CashSessionRepository cashSessionRepository;
    private final InventoryMovementService inventoryMovementService;
    private final CashMovementService cashMovementService;
    private final ReceivableService receivableService;
    private final SaleReturnRepository saleReturnRepository;
    private final SaleMapper saleMapper;

    @Override
    @Transactional
    public SaleResponse create(SaleRequest request, AuthenticatedUser authenticatedUser) {
        validateCreateRequest(request);

        Long userId = authenticatedUser.getId();
        User user = userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        CashSession cashSession = cashSessionRepository.findByOpenedByIdAndStatus(userId, CashSessionStatus.OPEN)
                .orElseThrow(OpenCashSessionRequiredException::new);
        Customer customer = findCustomer(request.getCustomerId());

        Map<Long, BigDecimal> quantitiesByProductId = groupQuantities(request.getItems());
        List<Long> orderedProductIds = quantitiesByProductId.keySet().stream().sorted().toList();
        List<Product> lockedProducts = productRepository.findAllActiveByIdInForUpdate(orderedProductIds);
        Map<Long, Product> productsById = toProductMap(lockedProducts);
        validateProductsAndStock(orderedProductIds, quantitiesByProductId, productsById);

        Sale sale = Sale.builder()
                .cashSession(cashSession)
                .createdBy(user)
                .customer(customer)
                .saleType(request.getSaleType())
                .status(SaleStatus.COMPLETED)
                .cashReceived(request.getCashReceived())
                .total(BigDecimal.ZERO)
                .changeAmount(null)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (Long productId : orderedProductIds) {
            Product product = productsById.get(productId);
            BigDecimal quantity = quantitiesByProductId.get(productId);
            BigDecimal lineTotal = product.getSalePrice().multiply(quantity);
            total = total.add(lineTotal);

            sale.addItem(SaleItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .productBarcode(product.getBarcode())
                    .productUnit(product.getUnit())
                    .quantity(quantity)
                    .unitPrice(product.getSalePrice())
                    .unitCost(product.getCostPrice())
                    .lineTotal(lineTotal)
                    .build());
        }

        if (request.getSaleType() == SaleType.CASH) {
            if (request.getCashReceived().compareTo(total) < 0) {
                throw new InsufficientCashReceivedException(total, request.getCashReceived());
            }
            sale.setChangeAmount(request.getCashReceived().subtract(total));
        }

        sale.setTotal(total);

        Sale savedSale = saleRepository.saveAndFlush(sale);
        for (SaleItem item : savedSale.getItems()) {
            inventoryMovementService.registerSaleMovement(
                    item.getProduct(),
                    item.getQuantity(),
                    item.getId(),
                    user
            );
        }
        if (request.getSaleType() == SaleType.CASH) {
            cashMovementService.registerCashSale(cashSession, user, total, savedSale.getId());
        } else {
            receivableService.createForCreditSale(savedSale, customer);
        }

        return saleMapper.toResponse(savedSale);
    }

    @Override
    @Transactional(readOnly = true)
    public SaleDetailResponse findById(Long id, AuthenticatedUser authenticatedUser) {
        User authenticated = findActiveUser(authenticatedUser.getId());
        Sale sale = saleRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new SaleNotFoundException(id));

        if (authenticated.getRole() != Role.ADMIN
                && !sale.getCreatedBy().getId().equals(authenticated.getId())) {
            throw new SaleAccessDeniedException();
        }

        SaleDetailResponse response = saleMapper.toDetailResponse(sale);
        response.setTotalReturnedAmount(saleReturnRepository.sumTotalAmountBySaleId(sale.getId()));
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SaleSummaryResponse> findCurrentSession(AuthenticatedUser authenticatedUser, Pageable pageable) {
        validatePageSize(pageable);
        User user = findActiveUser(authenticatedUser.getId());
        CashSession cashSession = cashSessionRepository.findByOpenedByIdAndStatus(
                        user.getId(),
                        CashSessionStatus.OPEN
                )
                .orElseThrow(OpenCashSessionRequiredException::new);

        return toSummaryPageResponse(saleRepository.findSummariesByCashSessionId(cashSession.getId(), pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SaleSummaryResponse> findAll(
            Long id,
            Long customerId,
            Long createdByUserId,
            SaleStatus status,
            SaleType saleType,
            OffsetDateTime from,
            OffsetDateTime to,
            Pageable pageable
    ) {
        validatePageSize(pageable);
        validateDateRange(from, to);

        return toSummaryPageResponse(saleRepository.findSummaries(
                id,
                customerId,
                createdByUserId,
                status,
                saleType,
                from,
                to,
                pageable
        ));
    }

    private void validateCreateRequest(SaleRequest request) {
        if (request.getSaleType() != SaleType.CASH && request.getSaleType() != SaleType.CREDIT) {
            throw new IllegalArgumentException("Solo se permiten ventas en efectivo o fiadas");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("La venta debe incluir al menos un articulo");
        }
        if (request.getItems().size() > MAX_LINES) {
            throw new IllegalArgumentException("La venta no debe superar " + MAX_LINES + " lineas");
        }
        if (request.getSaleType() == SaleType.CASH) {
            validateCashReceived(request.getCashReceived());
        } else {
            validateCreditSaleRequest(request);
        }
        request.getItems().forEach(this::validateSaleItem);
    }

    private void validateCreditSaleRequest(SaleRequest request) {
        if (request.getCustomerId() == null) {
            throw new CreditSaleCustomerRequiredException();
        }
        if (request.getCashReceived() != null) {
            throw new CreditSaleCashReceivedNotAllowedException();
        }
    }

    private void validateCashReceived(BigDecimal cashReceived) {
        if (cashReceived == null) {
            throw new IllegalArgumentException("El efectivo recibido es obligatorio");
        }
        if (cashReceived.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El efectivo recibido debe ser mayor que cero");
        }
        if (cashReceived.stripTrailingZeros().scale() > MAX_SCALE) {
            throw new IllegalArgumentException("El efectivo recibido debe tener hasta 2 decimales");
        }
        if (getIntegerDigits(cashReceived) > MAX_AMOUNT_INTEGER_DIGITS) {
            throw new IllegalArgumentException("El efectivo recibido debe tener hasta 10 enteros");
        }
    }

    private void validateSaleItem(SaleItemRequest item) {
        if (item == null) {
            throw new IllegalArgumentException("El articulo es obligatorio");
        }
        if (item.getProductId() == null || item.getProductId() <= 0) {
            throw new IllegalArgumentException("El producto debe ser positivo");
        }
        if (item.getQuantity() == null) {
            throw new IllegalArgumentException("La cantidad es obligatoria");
        }
        if (item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor que cero");
        }
        if (item.getQuantity().stripTrailingZeros().scale() > MAX_SCALE) {
            throw new IllegalArgumentException("La cantidad debe tener hasta 2 decimales");
        }
        if (getIntegerDigits(item.getQuantity()) > MAX_QUANTITY_INTEGER_DIGITS) {
            throw new IllegalArgumentException("La cantidad debe tener hasta 8 enteros");
        }
    }

    private Customer findCustomer(Long customerId) {
        if (customerId == null) {
            return null;
        }
        return customerRepository.findByIdAndActiveTrue(customerId)
                .orElseThrow(() -> new CustomerNotFoundException(customerId));
    }

    private Map<Long, BigDecimal> groupQuantities(List<SaleItemRequest> items) {
        Map<Long, BigDecimal> quantitiesByProductId = new LinkedHashMap<>();
        for (SaleItemRequest item : items) {
            quantitiesByProductId.merge(item.getProductId(), item.getQuantity(), BigDecimal::add);
        }
        return quantitiesByProductId;
    }

    private Map<Long, Product> toProductMap(List<Product> products) {
        Map<Long, Product> productsById = new HashMap<>();
        for (Product product : products) {
            productsById.put(product.getId(), product);
        }
        return productsById;
    }

    private void validateProductsAndStock(
            List<Long> orderedProductIds,
            Map<Long, BigDecimal> quantitiesByProductId,
            Map<Long, Product> productsById
    ) {
        for (Long productId : orderedProductIds) {
            Product product = productsById.get(productId);
            if (product == null) {
                throw new ProductNotFoundException(productId);
            }
            BigDecimal quantity = quantitiesByProductId.get(productId);
            if (product.getCurrentStock().compareTo(quantity) < 0) {
                throw new InsufficientStockException(product.getName(), product.getCurrentStock(), quantity);
            }
        }
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private void validateDateRange(OffsetDateTime from, OffsetDateTime to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("From date must not be after to date");
        }
    }

    private int getIntegerDigits(BigDecimal amount) {
        BigDecimal normalizedAmount = amount.stripTrailingZeros();
        return Math.max(normalizedAmount.precision() - normalizedAmount.scale(), 1);
    }

    private User findActiveUser(Long userId) {
        return userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private PageResponse<SaleSummaryResponse> toSummaryPageResponse(Page<SaleSummaryResponse> salesPage) {
        return PageResponse.<SaleSummaryResponse>builder()
                .content(salesPage.getContent())
                .page(salesPage.getNumber())
                .size(salesPage.getSize())
                .totalElements(salesPage.getTotalElements())
                .totalPages(salesPage.getTotalPages())
                .first(salesPage.isFirst())
                .last(salesPage.isLast())
                .build();
    }
}
