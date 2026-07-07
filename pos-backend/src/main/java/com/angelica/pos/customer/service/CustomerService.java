package com.angelica.pos.customer.service;

import com.angelica.pos.customer.dto.CustomerRequest;
import com.angelica.pos.customer.dto.CustomerResponse;
import com.angelica.pos.customer.dto.CustomerUpdateRequest;
import com.angelica.pos.shared.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CustomerService {

    CustomerResponse create(CustomerRequest request);

    PageResponse<CustomerResponse> findAllActive(String search, Pageable pageable);

    CustomerResponse findById(Long id);

    CustomerResponse update(Long id, CustomerUpdateRequest request);

    void deactivate(Long id);
}
