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
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
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
                .saleType(SaleType.CASH)
                .status(SaleStatus.COMPLETED)
                .cashReceived(request.getCashReceived())
                .total(BigDecimal.ZERO)
                .changeAmount(BigDecimal.ZERO)
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

        if (request.getCashReceived().compareTo(total) < 0) {
            throw new InsufficientCashReceivedException(total, request.getCashReceived());
        }

        sale.setTotal(total);
        sale.setChangeAmount(request.getCashReceived().subtract(total));

        Sale savedSale = saleRepository.saveAndFlush(sale);
        for (SaleItem item : savedSale.getItems()) {
            inventoryMovementService.registerSaleMovement(
                    item.getProduct(),
                    item.getQuantity(),
                    item.getId(),
                    user
            );
        }
        cashMovementService.registerCashSale(cashSession, user, total, savedSale.getId());

        return saleMapper.toResponse(savedSale);
    }

    @Override
    @Transactional(readOnly = true)
    public SaleResponse findById(Long id, AuthenticatedUser authenticatedUser) {
        Sale sale = saleRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new SaleNotFoundException(id));

        if (authenticatedUser.getRole() != Role.ADMIN
                && !sale.getCreatedBy().getId().equals(authenticatedUser.getId())) {
            throw new SaleAccessDeniedException();
        }

        return saleMapper.toResponse(sale);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> findCurrentSession(AuthenticatedUser authenticatedUser, Pageable pageable) {
        validatePageSize(pageable);
        CashSession cashSession = cashSessionRepository.findByOpenedByIdAndStatus(
                        authenticatedUser.getId(),
                        CashSessionStatus.OPEN
                )
                .orElseThrow(OpenCashSessionRequiredException::new);

        return toPageResponse(saleRepository.findByCashSessionId(cashSession.getId(), pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> findAll(
            Long id,
            Long customerId,
            Long createdByUserId,
            SaleStatus status,
            OffsetDateTime from,
            OffsetDateTime to,
            Pageable pageable
    ) {
        validatePageSize(pageable);
        validateDateRange(from, to);

        return toPageResponse(saleRepository.findAll(buildSpecification(
                id,
                customerId,
                createdByUserId,
                status,
                from,
                to
        ), pageable));
    }

    private void validateCreateRequest(SaleRequest request) {
        if (request.getSaleType() == SaleType.CREDIT) {
            throw new CreditSaleNotAvailableException();
        }
        if (request.getSaleType() != SaleType.CASH) {
            throw new IllegalArgumentException("Solo se permiten ventas en efectivo");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("La venta debe incluir al menos un articulo");
        }
        if (request.getItems().size() > MAX_LINES) {
            throw new IllegalArgumentException("La venta no debe superar " + MAX_LINES + " lineas");
        }
        validateCashReceived(request.getCashReceived());
        request.getItems().forEach(this::validateSaleItem);
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

    private Specification<Sale> buildSpecification(
            Long id,
            Long customerId,
            Long createdByUserId,
            SaleStatus status,
            OffsetDateTime from,
            OffsetDateTime to
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (id != null) {
                predicates.add(criteriaBuilder.equal(root.get("id"), id));
            }
            if (customerId != null) {
                Join<Sale, Customer> customerJoin = root.join("customer", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(customerJoin.get("id"), customerId));
            }
            if (createdByUserId != null) {
                Join<Sale, User> createdByJoin = root.join("createdBy", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(createdByJoin.get("id"), createdByUserId));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (from != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private PageResponse<SaleResponse> toPageResponse(Page<Sale> salesPage) {
        List<SaleResponse> content = saleMapper.toResponseList(salesPage.getContent());

        return PageResponse.<SaleResponse>builder()
                .content(content)
                .page(salesPage.getNumber())
                .size(salesPage.getSize())
                .totalElements(salesPage.getTotalElements())
                .totalPages(salesPage.getTotalPages())
                .first(salesPage.isFirst())
                .last(salesPage.isLast())
                .build();
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
}
