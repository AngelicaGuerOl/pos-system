package com.angelica.pos.catalog.product.service;

import com.angelica.pos.catalog.category.entity.Category;
import com.angelica.pos.catalog.category.exception.CategoryNotFoundException;
import com.angelica.pos.catalog.category.repository.CategoryRepository;
import com.angelica.pos.catalog.product.dto.ProductRequest;
import com.angelica.pos.catalog.product.dto.ProductResponse;
import com.angelica.pos.catalog.product.dto.ProductUpdateRequest;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.exception.ProductAlreadyExistsException;
import com.angelica.pos.catalog.product.exception.ProductNotFoundException;
import com.angelica.pos.catalog.product.mapper.ProductMapper;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.shared.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = findActiveCategoryById(request.getCategoryId());
        String normalizedBarcode = normalizeBarcode(request.getBarcode());
        validateSalePrice(request.getSalePrice(), request.getCostPrice());

        if (productRepository.existsByBarcodeIgnoreCase(normalizedBarcode)) {
            throw new ProductAlreadyExistsException(normalizedBarcode);
        }

        Product product = productMapper.toEntity(request);
        product.setCategory(category);
        product.setBarcode(normalizedBarcode);
        product.setName(normalizeName(request.getName()));
        product.setDescription(normalizeDescription(request.getDescription()));

        Product savedProduct = productRepository.save(product);
        return productMapper.toResponse(savedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> findAllActive(
            String search,
            Long categoryId,
            Boolean lowStock,
            Pageable pageable
    ) {
        validatePageSize(pageable);

        String normalizedSearch = normalizeSearch(search);
        Page<Product> productsPage = normalizedSearch == null
                ? productRepository.findAllActiveWithFilters(categoryId, lowStock, pageable)
                : productRepository.findAllActiveWithSearchAndFilters(
                        normalizedSearch,
                        categoryId,
                        lowStock,
                        pageable
                );

        List<ProductResponse> content = productMapper.toResponseList(productsPage.getContent());

        return PageResponse.<ProductResponse>builder()
                .content(content)
                .page(productsPage.getNumber())
                .size(productsPage.getSize())
                .totalElements(productsPage.getTotalElements())
                .totalPages(productsPage.getTotalPages())
                .first(productsPage.isFirst())
                .last(productsPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        Product product = findActiveProductById(id);
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse findByBarcode(String barcode) {
        String normalizedBarcode = normalizeBarcode(barcode);
        Product product = productRepository.findByBarcodeIgnoreCaseAndActiveTrue(normalizedBarcode)
                .orElseThrow(() -> new ProductNotFoundException(normalizedBarcode));

        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse update(Long id, ProductUpdateRequest request) {
        Product product = findActiveProductById(id);
        Category category = findActiveCategoryById(request.getCategoryId());
        String normalizedBarcode = normalizeBarcode(request.getBarcode());
        validateSalePrice(request.getSalePrice(), request.getCostPrice());

        if (productRepository.existsByBarcodeIgnoreCaseAndIdNot(normalizedBarcode, id)) {
            throw new ProductAlreadyExistsException(normalizedBarcode);
        }

        productMapper.updateEntityFromRequest(request, product);
        product.setCategory(category);
        product.setBarcode(normalizedBarcode);
        product.setName(normalizeName(request.getName()));
        product.setDescription(normalizeDescription(request.getDescription()));

        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        Product product = findActiveProductById(id);
        product.setActive(false);
    }

    private Product findActiveProductById(Long id) {
        return productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    private Category findActiveCategoryById(Long id) {
        return categoryRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private void validateSalePrice(BigDecimal salePrice, BigDecimal costPrice) {
        if (salePrice != null && costPrice != null && salePrice.compareTo(costPrice) < 0) {
            throw new IllegalArgumentException("El precio de venta no debe ser menor que el precio de costo");
        }
    }

    private String normalizeBarcode(String barcode) {
        return barcode.trim();
    }

    private String normalizeName(String name) {
        return name.trim();
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String normalizedDescription = description.trim();
        return normalizedDescription.isEmpty() ? null : normalizedDescription;
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String normalizedSearch = search.trim();
        return normalizedSearch.isEmpty() ? null : normalizedSearch;
    }
}
