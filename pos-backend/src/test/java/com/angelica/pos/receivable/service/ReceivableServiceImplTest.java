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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReceivableServiceImplTest {

    private ReceivableRepository receivableRepository;
    private CustomerRepository customerRepository;
    private ReceivableMapper receivableMapper;
    private ReceivableServiceImpl receivableService;

    @BeforeEach
    void setUp() {
        receivableRepository = mock(ReceivableRepository.class);
        customerRepository = mock(CustomerRepository.class);
        receivableMapper = mock(ReceivableMapper.class);
        receivableService = new ReceivableServiceImpl(receivableRepository, customerRepository, receivableMapper);
    }

    @Test
    void createForCreditSaleCreatesPendingReceivable() {
        Customer customer = customer(8L);
        Sale sale = Sale.builder().id(20L).customer(customer).total(new BigDecimal("500.00")).build();
        when(receivableRepository.existsBySaleId(20L)).thenReturn(false);
        when(receivableRepository.save(any(Receivable.class))).thenAnswer(invocation -> {
            Receivable receivable = invocation.getArgument(0);
            receivable.setId(30L);
            return receivable;
        });

        Receivable result = receivableService.createForCreditSale(sale, customer);

        assertEquals(30L, result.getId());
        assertEquals(result, sale.getReceivable());
        verify(receivableRepository).save(org.mockito.ArgumentMatchers.argThat(receivable ->
                receivable.getSale() == sale
                        && receivable.getCustomer() == customer
                        && receivable.getOriginalAmount().compareTo(new BigDecimal("500.00")) == 0
                        && receivable.getPaidAmount().compareTo(BigDecimal.ZERO) == 0
                        && receivable.getOutstandingBalance().compareTo(new BigDecimal("500.00")) == 0
                        && receivable.getStatus() == ReceivableStatus.PENDING
                        && receivable.getPaidAt() == null
        ));
    }

    @Test
    void createForSaleAlreadyAssociatedIsRejected() {
        Customer customer = customer(8L);
        Sale sale = Sale.builder().id(20L).customer(customer).total(new BigDecimal("500.00")).build();
        when(receivableRepository.existsBySaleId(20L)).thenReturn(true);

        assertThrows(SaleAlreadyHasReceivableException.class, () -> receivableService.createForCreditSale(sale, customer));
    }

    @Test
    void findAllAppliesFiltersAndReturnsPage() {
        PageRequest pageable = PageRequest.of(0, 10);
        Receivable receivable = receivable(30L);
        ReceivableSummaryResponse summary = new ReceivableSummaryResponse();
        summary.setId(30L);
        OffsetDateTime from = OffsetDateTime.parse("2026-07-01T00:00:00Z");
        OffsetDateTime to = OffsetDateTime.parse("2026-07-31T23:59:59Z");
        when(receivableRepository.findAll(any(Specification.class), org.mockito.ArgumentMatchers.eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(receivable), pageable, 1));
        when(receivableMapper.toSummaryResponseList(List.of(receivable))).thenReturn(List.of(summary));

        PageResponse<ReceivableSummaryResponse> result = receivableService.findAll(
                8L,
                20L,
                ReceivableStatus.PENDING,
                from,
                to,
                pageable
        );

        assertEquals(1, result.getTotalElements());
        assertEquals(summary, result.getContent().get(0));
    }

    @Test
    void findByIdReturnsDetailOrNotFound() {
        Receivable receivable = receivable(30L);
        ReceivableDetailResponse detail = new ReceivableDetailResponse();
        detail.setId(30L);
        when(receivableRepository.findByIdWithDetails(30L)).thenReturn(Optional.of(receivable));
        when(receivableMapper.toDetailResponse(receivable)).thenReturn(detail);

        assertEquals(detail, receivableService.findById(30L));
        when(receivableRepository.findByIdWithDetails(99L)).thenReturn(Optional.empty());
        assertThrows(ReceivableNotFoundException.class, () -> receivableService.findById(99L));
    }

    @Test
    void findByCustomerVerifiesCustomerAndReturnsPage() {
        PageRequest pageable = PageRequest.of(0, 10);
        Receivable receivable = receivable(30L);
        ReceivableSummaryResponse summary = new ReceivableSummaryResponse();
        summary.setId(30L);
        when(customerRepository.findByIdAndActiveTrue(8L)).thenReturn(Optional.of(customer(8L)));
        when(receivableRepository.findAll(any(Specification.class), org.mockito.ArgumentMatchers.eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(receivable), pageable, 1));
        when(receivableMapper.toSummaryResponseList(List.of(receivable))).thenReturn(List.of(summary));

        PageResponse<ReceivableSummaryResponse> result =
                receivableService.findByCustomer(8L, ReceivableStatus.PENDING, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(summary, result.getContent().get(0));
    }

    @Test
    void findByCustomerMissingCustomerIsRejected() {
        when(customerRepository.findByIdAndActiveTrue(8L)).thenReturn(Optional.empty());

        assertThrows(
                CustomerNotFoundException.class,
                () -> receivableService.findByCustomer(8L, null, PageRequest.of(0, 10))
        );
    }

    @Test
    void invalidDateRangeAndPageSizeAreRejected() {
        assertThrows(
                IllegalArgumentException.class,
                () -> receivableService.findAll(
                        null,
                        null,
                        null,
                        OffsetDateTime.parse("2026-08-01T00:00:00Z"),
                        OffsetDateTime.parse("2026-07-01T00:00:00Z"),
                        PageRequest.of(0, 10)
                )
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> receivableService.findAll(null, null, null, null, null, PageRequest.of(0, 51))
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> receivableService.findByCustomer(8L, null, PageRequest.of(0, 51))
        );
    }

    private Receivable receivable(Long id) {
        Customer customer = customer(8L);
        Sale sale = Sale.builder().id(20L).customer(customer).total(new BigDecimal("500.00")).build();
        return Receivable.builder()
                .id(id)
                .sale(sale)
                .customer(customer)
                .originalAmount(new BigDecimal("500.00"))
                .paidAmount(BigDecimal.ZERO)
                .outstandingBalance(new BigDecimal("500.00"))
                .status(ReceivableStatus.PENDING)
                .createdAt(OffsetDateTime.parse("2026-07-13T10:00:00Z"))
                .build();
    }

    private Customer customer(Long id) {
        return Customer.builder()
                .id(id)
                .firstName("Ana")
                .lastName("Lopez")
                .active(true)
                .build();
    }
}
