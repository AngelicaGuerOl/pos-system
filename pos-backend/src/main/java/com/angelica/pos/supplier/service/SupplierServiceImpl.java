package com.angelica.pos.supplier.service;

import com.angelica.pos.catalog.product.dto.ProductResponse;
import com.angelica.pos.catalog.product.mapper.ProductMapper;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.supplier.dto.SupplierRequest;
import com.angelica.pos.supplier.dto.SupplierResponse;
import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.supplier.exception.SupplierAlreadyExistsException;
import com.angelica.pos.supplier.exception.SupplierNotFoundException;
import com.angelica.pos.supplier.mapper.SupplierMapper;
import com.angelica.pos.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private static final int MAX_PAGE_SIZE = 50;

    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final SupplierMapper supplierMapper;
    private final ProductMapper productMapper;

    @Override
    @Transactional
    public SupplierResponse create(SupplierRequest request) {
        String name = normalizeRequired(request.getName());
        if (supplierRepository.existsByNameIgnoreCase(name)) {
            throw new SupplierAlreadyExistsException(name);
        }
        Supplier supplier = supplierMapper.toEntity(request);
        applyNormalizedFields(supplier, request);
        return supplierMapper.toResponse(supplierRepository.save(supplier));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupplierResponse> findAll(String search, Boolean active, Pageable pageable) {
        validatePageSize(pageable);
        Page<Supplier> page = supplierRepository.findAllWithFilters(normalizeSearch(search), active, pageable);
        return toPage(page, supplierMapper.toResponseList(page.getContent()));
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse findById(Long id) {
        return supplierMapper.toResponse(findSupplier(id));
    }

    @Override
    @Transactional
    public SupplierResponse update(Long id, SupplierRequest request) {
        Supplier supplier = findSupplier(id);
        String name = normalizeRequired(request.getName());
        if (supplierRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new SupplierAlreadyExistsException(name);
        }
        supplierMapper.updateEntityFromRequest(request, supplier);
        applyNormalizedFields(supplier, request);
        return supplierMapper.toResponse(supplier);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        Supplier supplier = findSupplier(id);
        supplier.setActive(false);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> findProducts(Long supplierId, String search, Pageable pageable) {
        validatePageSize(pageable);
        if (supplierRepository.findById(supplierId).isEmpty()) {
            throw new SupplierNotFoundException(supplierId);
        }
        Page<com.angelica.pos.catalog.product.entity.Product> page =
                productRepository.findActiveBySupplier(supplierId, normalizeSearch(search), pageable);
        return toPage(page, productMapper.toResponseList(page.getContent()));
    }

    private Supplier findSupplier(Long id) {
        return supplierRepository.findById(id).orElseThrow(() -> new SupplierNotFoundException(id));
    }

    private void applyNormalizedFields(Supplier supplier, SupplierRequest request) {
        supplier.setName(normalizeRequired(request.getName()));
        supplier.setContactName(normalizeOptional(request.getContactName()));
        supplier.setPhone(normalizeOptional(request.getPhone()));
        supplier.setEmail(normalizeOptional(request.getEmail()));
        supplier.setNotes(normalizeOptional(request.getNotes()));
    }

    private String normalizeRequired(String value) {
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSearch(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private <T> PageResponse<T> toPage(Page<?> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
