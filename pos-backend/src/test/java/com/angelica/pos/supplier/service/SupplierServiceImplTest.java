package com.angelica.pos.supplier.service;

import com.angelica.pos.catalog.product.mapper.ProductMapper;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.supplier.dto.SupplierRequest;
import com.angelica.pos.supplier.dto.SupplierResponse;
import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.supplier.exception.SupplierAlreadyExistsException;
import com.angelica.pos.supplier.mapper.SupplierMapper;
import com.angelica.pos.supplier.repository.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SupplierServiceImplTest {

    private SupplierRepository supplierRepository;
    private SupplierMapper supplierMapper;
    private SupplierServiceImpl supplierService;

    @BeforeEach
    void setUp() {
        supplierRepository = mock(SupplierRepository.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        supplierMapper = mock(SupplierMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        supplierService = new SupplierServiceImpl(
                supplierRepository,
                productRepository,
                supplierMapper,
                productMapper
        );
    }

    @Test
    void createTrimsSupplierNameAndOptionalFields() {
        SupplierRequest request = buildRequest(" Barcel ", " Contacto ");
        Supplier supplier = Supplier.builder().build();
        SupplierResponse response = new SupplierResponse();
        response.setId(1L);

        when(supplierRepository.existsByNameIgnoreCase("Barcel")).thenReturn(false);
        when(supplierMapper.toEntity(request)).thenReturn(supplier);
        when(supplierRepository.save(supplier)).thenReturn(supplier);
        when(supplierMapper.toResponse(supplier)).thenReturn(response);

        SupplierResponse result = supplierService.create(request);

        assertEquals(1L, result.getId());
        assertEquals("Barcel", supplier.getName());
        assertEquals("Contacto", supplier.getContactName());
        verify(supplierRepository).save(supplier);
    }

    @Test
    void createRejectsDuplicateNameIgnoringCase() {
        SupplierRequest request = buildRequest(" Barcel ", null);
        when(supplierRepository.existsByNameIgnoreCase("Barcel")).thenReturn(true);

        assertThrows(SupplierAlreadyExistsException.class, () -> supplierService.create(request));
    }

    @Test
    void deactivateKeepsSupplierAndMarksInactive() {
        Supplier supplier = Supplier.builder()
                .id(3L)
                .name("Barcel")
                .active(true)
                .build();
        when(supplierRepository.findById(3L)).thenReturn(Optional.of(supplier));

        supplierService.deactivate(3L);

        assertFalse(supplier.getActive());
    }

    private SupplierRequest buildRequest(String name, String contactName) {
        SupplierRequest request = new SupplierRequest();
        request.setName(name);
        request.setContactName(contactName);
        request.setPhone(" 555 ");
        request.setEmail(null);
        request.setNotes(" ");
        return request;
    }
}
