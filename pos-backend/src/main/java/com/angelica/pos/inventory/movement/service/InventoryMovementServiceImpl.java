package com.angelica.pos.inventory.movement.service;

import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.exception.ProductNotFoundException;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.inventory.movement.dto.InventoryMovementResponse;
import com.angelica.pos.inventory.movement.dto.ManualInventoryMovementRequest;
import com.angelica.pos.inventory.movement.entity.InventoryMovement;
import com.angelica.pos.inventory.movement.entity.InventoryMovementDirection;
import com.angelica.pos.inventory.movement.entity.InventoryMovementType;
import com.angelica.pos.inventory.movement.exception.InsufficientStockException;
import com.angelica.pos.inventory.movement.exception.InventoryMovementNotFoundException;
import com.angelica.pos.inventory.movement.mapper.InventoryMovementMapper;
import com.angelica.pos.inventory.movement.repository.InventoryMovementRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
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
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryMovementServiceImpl implements InventoryMovementService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_QUANTITY_INTEGER_DIGITS = 8;
    private static final int MAX_QUANTITY_SCALE = 2;
    private static final String PRODUCT_CREATION_SOURCE_TYPE = "PRODUCT_CREATION";

    private final InventoryMovementRepository inventoryMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryMovementMapper inventoryMovementMapper;

    @Override
    @Transactional
    public InventoryMovementResponse registerManualEntry(
            ManualInventoryMovementRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        validateManualRequest(request);
        return registerStockMovement(
                request.getProductId(),
                request.getQuantity(),
                request.getDescription(),
                InventoryMovementDirection.IN,
                InventoryMovementType.MANUAL_ENTRY,
                null,
                null,
                authenticatedUser
        );
    }

    @Override
    @Transactional
    public InventoryMovementResponse registerManualExit(
            ManualInventoryMovementRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        validateManualRequest(request);
        return registerStockMovement(
                request.getProductId(),
                request.getQuantity(),
                request.getDescription(),
                InventoryMovementDirection.OUT,
                InventoryMovementType.MANUAL_EXIT,
                null,
                null,
                authenticatedUser
        );
    }

    @Override
    @Transactional
    public InventoryMovementResponse registerInitialStock(
            Long productId,
            BigDecimal initialStock,
            AuthenticatedUser authenticatedUser
    ) {
        return registerStockMovement(
                productId,
                initialStock,
                "Stock inicial del producto",
                InventoryMovementDirection.IN,
                InventoryMovementType.INITIAL_STOCK,
                PRODUCT_CREATION_SOURCE_TYPE,
                productId,
                authenticatedUser
        );
    }

    @Override
    @Transactional
    public InventoryMovementResponse registerStockMovement(
            Long productId,
            BigDecimal quantity,
            String description,
            InventoryMovementDirection direction,
            InventoryMovementType type,
            String sourceType,
            Long sourceId,
            AuthenticatedUser authenticatedUser
    ) {
        validateStockMovement(productId, quantity, description, direction, type, sourceType, sourceId);

        Long userId = authenticatedUser.getId();
        User user = userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        Product product = productRepository.findByIdAndActiveTrueForUpdate(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        BigDecimal previousStock = product.getCurrentStock();
        BigDecimal newStock = calculateNewStock(product, previousStock, quantity, direction);
        product.setCurrentStock(newStock);

        InventoryMovement movement = InventoryMovement.builder()
                .product(product)
                .createdBy(user)
                .direction(direction)
                .type(type)
                .quantity(quantity)
                .previousStock(previousStock)
                .newStock(newStock)
                .description(description.trim())
                .sourceType(sourceType == null ? null : sourceType.trim())
                .sourceId(sourceId)
                .build();

        InventoryMovement savedMovement = inventoryMovementRepository.save(movement);
        return inventoryMovementMapper.toResponse(savedMovement);
    }

    @Override
    @Transactional
    public InventoryMovement registerSaleMovement(
            Product lockedProduct,
            BigDecimal quantity,
            Long saleItemId,
            User user
    ) {
        validateStockMovement(
                lockedProduct == null ? null : lockedProduct.getId(),
                quantity,
                "Venta",
                InventoryMovementDirection.OUT,
                InventoryMovementType.SALE,
                "SALE_ITEM",
                saleItemId
        );
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User is required");
        }

        BigDecimal previousStock = lockedProduct.getCurrentStock();
        BigDecimal newStock = calculateNewStock(
                lockedProduct,
                previousStock,
                quantity,
                InventoryMovementDirection.OUT
        );
        lockedProduct.setCurrentStock(newStock);

        InventoryMovement movement = InventoryMovement.builder()
                .product(lockedProduct)
                .createdBy(user)
                .direction(InventoryMovementDirection.OUT)
                .type(InventoryMovementType.SALE)
                .quantity(quantity)
                .previousStock(previousStock)
                .newStock(newStock)
                .description("Venta")
                .sourceType("SALE_ITEM")
                .sourceId(saleItemId)
                .build();

        return inventoryMovementRepository.save(movement);
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryMovementResponse findById(Long id) {
        InventoryMovement movement = inventoryMovementRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new InventoryMovementNotFoundException(id));

        return inventoryMovementMapper.toResponse(movement);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryMovementResponse> findAll(
            String search,
            Long productId,
            InventoryMovementDirection direction,
            InventoryMovementType type,
            OffsetDateTime from,
            OffsetDateTime to,
            Pageable pageable
    ) {
        validatePageSize(pageable);
        validateDateRange(from, to);

        String normalizedSearch = normalizeSearch(search);
        Page<InventoryMovement> movementsPage = inventoryMovementRepository.findAll(buildSpecification(
                normalizedSearch,
                productId,
                direction,
                type,
                from,
                to
        ), pageable);

        return toPageResponse(movementsPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryMovementResponse> findByProduct(Long productId, Pageable pageable) {
        validatePageSize(pageable);
        if (productRepository.findByIdAndActiveTrue(productId).isEmpty()) {
            throw new ProductNotFoundException(productId);
        }

        Page<InventoryMovement> movementsPage = inventoryMovementRepository.findByProductIdWithDetails(
                productId,
                pageable
        );
        return toPageResponse(movementsPage);
    }

    private Specification<InventoryMovement> buildSpecification(
            String search,
            Long productId,
            InventoryMovementDirection direction,
            InventoryMovementType type,
            OffsetDateTime from,
            OffsetDateTime to
    ) {
        return (root, query, criteriaBuilder) -> {
            Join<InventoryMovement, Product> productJoin = root.join("product", JoinType.INNER);
            List<Predicate> predicates = new ArrayList<>();

            if (search != null) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(productJoin.get("name")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(productJoin.get("barcode")), pattern)
                ));
            }

            if (productId != null) {
                predicates.add(criteriaBuilder.equal(productJoin.get("id"), productId));
            }

            if (direction != null) {
                predicates.add(criteriaBuilder.equal(root.get("direction"), direction));
            }

            if (type != null) {
                predicates.add(criteriaBuilder.equal(root.get("type"), type));
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

    private BigDecimal calculateNewStock(
            Product product,
            BigDecimal previousStock,
            BigDecimal quantity,
            InventoryMovementDirection direction
    ) {
        if (direction == InventoryMovementDirection.IN) {
            return previousStock.add(quantity);
        }

        if (previousStock.compareTo(quantity) < 0) {
            throw new InsufficientStockException(product.getName(), previousStock, quantity);
        }

        BigDecimal newStock = previousStock.subtract(quantity);
        if (newStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new InsufficientStockException(product.getName(), previousStock, quantity);
        }
        return newStock;
    }

    private PageResponse<InventoryMovementResponse> toPageResponse(Page<InventoryMovement> movementsPage) {
        List<InventoryMovementResponse> content = inventoryMovementMapper.toResponseList(movementsPage.getContent());

        return PageResponse.<InventoryMovementResponse>builder()
                .content(content)
                .page(movementsPage.getNumber())
                .size(movementsPage.getSize())
                .totalElements(movementsPage.getTotalElements())
                .totalPages(movementsPage.getTotalPages())
                .first(movementsPage.isFirst())
                .last(movementsPage.isLast())
                .build();
    }

    private void validateManualRequest(ManualInventoryMovementRequest request) {
        validateStockMovement(
                request.getProductId(),
                request.getQuantity(),
                request.getDescription(),
                InventoryMovementDirection.IN,
                InventoryMovementType.MANUAL_ENTRY,
                null,
                null
        );
    }

    private void validateStockMovement(
            Long productId,
            BigDecimal quantity,
            String description,
            InventoryMovementDirection direction,
            InventoryMovementType type,
            String sourceType,
            Long sourceId
    ) {
        if (productId == null || productId <= 0) {
            throw new IllegalArgumentException("Product id must be positive");
        }
        if (quantity == null) {
            throw new IllegalArgumentException("Quantity is required");
        }
        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
        if (quantity.stripTrailingZeros().scale() > MAX_QUANTITY_SCALE) {
            throw new IllegalArgumentException("Quantity must have up to 2 decimals");
        }
        if (getIntegerDigits(quantity) > MAX_QUANTITY_INTEGER_DIGITS) {
            throw new IllegalArgumentException("Quantity must have up to 8 integer digits");
        }
        if (description == null || description.trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (description.length() > 255) {
            throw new IllegalArgumentException("Description must have at most 255 characters");
        }
        if (direction == null) {
            throw new IllegalArgumentException("Direction is required");
        }
        if (type == null) {
            throw new IllegalArgumentException("Type is required");
        }
        validateTypeDirection(type, direction);
        validateSource(sourceType, sourceId);
        validateManualSource(type, sourceType, sourceId);
    }

    private void validateTypeDirection(InventoryMovementType type, InventoryMovementDirection direction) {
        boolean valid = (type == InventoryMovementType.INITIAL_STOCK && direction == InventoryMovementDirection.IN)
                || (type == InventoryMovementType.MANUAL_ENTRY && direction == InventoryMovementDirection.IN)
                || (type == InventoryMovementType.MANUAL_EXIT && direction == InventoryMovementDirection.OUT)
                || (type == InventoryMovementType.SALE && direction == InventoryMovementDirection.OUT)
                || (type == InventoryMovementType.RETURN && direction == InventoryMovementDirection.IN);

        if (!valid) {
            throw new IllegalArgumentException("Inventory movement type and direction are not compatible");
        }
    }

    private void validateSource(String sourceType, Long sourceId) {
        if (sourceType != null && sourceType.trim().isEmpty()) {
            throw new IllegalArgumentException("Source type cannot be blank");
        }
        boolean sourceTypePresent = sourceType != null;
        boolean sourceIdPresent = sourceId != null;
        if (sourceTypePresent != sourceIdPresent) {
            throw new IllegalArgumentException("Source type and source id must both be present or both be null");
        }
        if (sourceType != null && sourceType.trim().length() > 40) {
            throw new IllegalArgumentException("Source type must have at most 40 characters");
        }
    }

    private void validateManualSource(InventoryMovementType type, String sourceType, Long sourceId) {
        if ((type == InventoryMovementType.MANUAL_ENTRY || type == InventoryMovementType.MANUAL_EXIT)
                && (sourceType != null || sourceId != null)) {
            throw new IllegalArgumentException("Manual movements cannot have source data");
        }
    }

    private int getIntegerDigits(BigDecimal amount) {
        BigDecimal normalizedAmount = amount.stripTrailingZeros();
        return Math.max(normalizedAmount.precision() - normalizedAmount.scale(), 1);
    }

    private void validateDateRange(OffsetDateTime from, OffsetDateTime to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("From date must not be after to date");
        }
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String normalizedSearch = search.trim();
        return normalizedSearch.isEmpty() ? null : normalizedSearch;
    }
}
