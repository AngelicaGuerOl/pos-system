package com.angelica.pos.customer.service;

import com.angelica.pos.customer.dto.CustomerRequest;
import com.angelica.pos.customer.dto.CustomerResponse;
import com.angelica.pos.customer.dto.CustomerUpdateRequest;
import com.angelica.pos.customer.entity.Customer;
import com.angelica.pos.customer.exception.CustomerAlreadyExistsException;
import com.angelica.pos.customer.exception.CustomerNotFoundException;
import com.angelica.pos.customer.mapper.CustomerMapper;
import com.angelica.pos.customer.repository.CustomerRepository;
import com.angelica.pos.shared.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private static final int MAX_PAGE_SIZE = 50;

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Override
    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        String normalizedFirstName = normalizeRequiredText(request.getFirstName());
        String normalizedLastName = normalizeRequiredText(request.getLastName());
        String normalizedPhone = normalizeOptionalText(request.getPhone());

        validateDuplicateCustomer(normalizedFirstName, normalizedLastName, normalizedPhone, null);

        Customer customer = customerMapper.toEntity(request);
        customer.setFirstName(normalizedFirstName);
        customer.setLastName(normalizedLastName);
        customer.setPhone(normalizedPhone);

        Customer savedCustomer = customerRepository.save(customer);
        return customerMapper.toResponse(savedCustomer);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> findAllActive(String search, Pageable pageable) {
        validatePageSize(pageable);

        String normalizedSearch = normalizeSearch(search);
        Page<Customer> customersPage = normalizedSearch == null
                ? customerRepository.findAllActive(pageable)
                : customerRepository.findAllActiveWithSearch(normalizedSearch, pageable);

        List<CustomerResponse> content = customerMapper.toResponseList(customersPage.getContent());

        return PageResponse.<CustomerResponse>builder()
                .content(content)
                .page(customersPage.getNumber())
                .size(customersPage.getSize())
                .totalElements(customersPage.getTotalElements())
                .totalPages(customersPage.getTotalPages())
                .first(customersPage.isFirst())
                .last(customersPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id) {
        Customer customer = findActiveCustomerById(id);
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse update(Long id, CustomerUpdateRequest request) {
        Customer customer = findActiveCustomerById(id);
        String normalizedFirstName = normalizeRequiredText(request.getFirstName());
        String normalizedLastName = normalizeRequiredText(request.getLastName());
        String normalizedPhone = normalizeOptionalText(request.getPhone());

        validateDuplicateCustomer(normalizedFirstName, normalizedLastName, normalizedPhone, id);

        customerMapper.updateEntityFromRequest(request, customer);
        customer.setFirstName(normalizedFirstName);
        customer.setLastName(normalizedLastName);
        customer.setPhone(normalizedPhone);

        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        Customer customer = findActiveCustomerById(id);
        customer.setActive(false);
    }

    private Customer findActiveCustomerById(Long id) {
        return customerRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));
    }

    private void validateDuplicateCustomer(String firstName, String lastName, String phone, Long currentCustomerId) {
        if (phone == null) {
            return;
        }

        boolean exists = currentCustomerId == null
                ? customerRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCaseAndPhoneIgnoreCaseAndActiveTrue(
                        firstName,
                        lastName,
                        phone
                )
                : customerRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCaseAndPhoneIgnoreCaseAndActiveTrueAndIdNot(
                        firstName,
                        lastName,
                        phone,
                        currentCustomerId
                );

        if (exists) {
            throw new CustomerAlreadyExistsException(firstName, lastName, phone);
        }
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private String normalizeRequiredText(String value) {
        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalizedValue = value.trim();
        return normalizedValue.isEmpty() ? null : normalizedValue;
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String normalizedSearch = search.trim();
        return normalizedSearch.isEmpty() ? null : normalizedSearch;
    }
}
