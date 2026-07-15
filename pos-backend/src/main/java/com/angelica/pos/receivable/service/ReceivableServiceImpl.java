package com.angelica.pos.receivable.service;

import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.customer.exception.CustomerNotFoundException;
import com.angelica.pos.customer.repository.CustomerRepository;
import com.angelica.pos.receivable.dto.ReceivableDetailResponse;
import com.angelica.pos.receivable.dto.ReceivableSummaryResponse;
import com.angelica.pos.receivable.entity.Receivable;
import com.angelica.pos.receivable.entity.ReceivableStatus;
import com.angelica.pos.receivable.exception.ReceivableNotFoundException;
import com.angelica.pos.receivable.exception.SaleAlreadyHasReceivableException;
import com.angelica.pos.receivable.mapper.ReceivableMapper;
import com.angelica.pos.receivable.repository.ReceivableRepository;
import com.angelica.pos.sale.entity.Sale;
import com.angelica.pos.shared.response.PageResponse;
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
public class ReceivableServiceImpl implements ReceivableService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ReceivableRepository receivableRepository;
    private final CustomerRepository customerRepository;
    private final ReceivableMapper receivableMapper;

    @Override
    @Transactional
    public Receivable createForCreditSale(Sale sale, Customer customer) {
        if (sale == null || sale.getId() == null) {
            throw new IllegalArgumentException("Sale id is required");
        }
        if (customer == null || customer.getId() == null) {
            throw new IllegalArgumentException("Customer id is required");
        }
        if (receivableRepository.existsBySaleId(sale.getId())) {
            throw new SaleAlreadyHasReceivableException(sale.getId());
        }

        Receivable receivable = Receivable.builder()
                .sale(sale)
                .customer(customer)
                .originalAmount(sale.getTotal())
                .returnedAmount(BigDecimal.ZERO)
                .adjustedAmount(sale.getTotal())
                .paidAmount(BigDecimal.ZERO)
                .outstandingBalance(sale.getTotal())
                .status(ReceivableStatus.PENDING)
                .paidAt(null)
                .build();

        Receivable savedReceivable = receivableRepository.save(receivable);
        sale.setReceivable(savedReceivable);
        return savedReceivable;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReceivableSummaryResponse> findAll(
            Long customerId,
            Long saleId,
            ReceivableStatus status,
            OffsetDateTime from,
            OffsetDateTime to,
            Pageable pageable
    ) {
        validatePageSize(pageable);
        validateDateRange(from, to);

        Page<Receivable> receivablesPage = receivableRepository.findAll(buildSpecification(
                customerId,
                saleId,
                status,
                from,
                to
        ), pageable);

        return toPageResponse(receivablesPage);
    }

    @Override
    @Transactional(readOnly = true)
    public ReceivableDetailResponse findById(Long id) {
        Receivable receivable = receivableRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ReceivableNotFoundException(id));

        return receivableMapper.toDetailResponse(receivable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReceivableSummaryResponse> findByCustomer(
            Long customerId,
            ReceivableStatus status,
            Pageable pageable
    ) {
        validatePageSize(pageable);
        if (customerRepository.findByIdAndActiveTrue(customerId).isEmpty()) {
            throw new CustomerNotFoundException(customerId);
        }

        Page<Receivable> receivablesPage = receivableRepository.findAll(buildSpecification(
                customerId,
                null,
                status,
                null,
                null
        ), pageable);

        return toPageResponse(receivablesPage);
    }

    private Specification<Receivable> buildSpecification(
            Long customerId,
            Long saleId,
            ReceivableStatus status,
            OffsetDateTime from,
            OffsetDateTime to
    ) {
        return (root, query, criteriaBuilder) -> {
            Join<Receivable, Customer> customerJoin = root.join("customer", JoinType.INNER);
            Join<Receivable, Sale> saleJoin = root.join("sale", JoinType.INNER);
            List<Predicate> predicates = new ArrayList<>();

            if (customerId != null) {
                predicates.add(criteriaBuilder.equal(customerJoin.get("id"), customerId));
            }
            if (saleId != null) {
                predicates.add(criteriaBuilder.equal(saleJoin.get("id"), saleId));
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

    private PageResponse<ReceivableSummaryResponse> toPageResponse(Page<Receivable> receivablesPage) {
        List<ReceivableSummaryResponse> content = receivableMapper.toSummaryResponseList(receivablesPage.getContent());

        return PageResponse.<ReceivableSummaryResponse>builder()
                .content(content)
                .page(receivablesPage.getNumber())
                .size(receivablesPage.getSize())
                .totalElements(receivablesPage.getTotalElements())
                .totalPages(receivablesPage.getTotalPages())
                .first(receivablesPage.isFirst())
                .last(receivablesPage.isLast())
                .build();
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
}
