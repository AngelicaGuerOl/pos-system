package com.angelica.pos.catalog.product.service;

import com.angelica.pos.catalog.product.dto.BarcodeLookupResponse;
import com.angelica.pos.catalog.product.dto.BarcodeLookupStatus;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.external.OpenFoodFactsClient;
import com.angelica.pos.catalog.product.external.OpenFoodFactsProduct;
import com.angelica.pos.catalog.product.mapper.ProductMapper;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BarcodeLookupServiceImpl implements BarcodeLookupService {

    private static final String OPEN_FOOD_FACTS_SOURCE = "OPEN_FOOD_FACTS";
    private static final int MAX_BARCODE_LENGTH = 50;
    private static final String EXTERNAL_BARCODE_PATTERN = "\\d{6,18}";

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final OpenFoodFactsClient openFoodFactsClient;

    @Override
    @Transactional(readOnly = true)
    public BarcodeLookupResponse lookup(String barcode) {
        String normalizedBarcode = normalizeBarcode(barcode);
        Product localProduct = productRepository.findByBarcodeIgnoreCase(normalizedBarcode).orElse(null);
        if (localProduct != null) {
            return BarcodeLookupResponse.builder()
                    .status(BarcodeLookupStatus.LOCAL_PRODUCT_EXISTS)
                    .barcode(normalizedBarcode)
                    .existingProductId(localProduct.getId())
                    .existingProductActive(localProduct.getActive())
                    .existingProduct(productMapper.toResponse(localProduct))
                    .build();
        }

        if (!canLookupExternally(normalizedBarcode)) {
            return notFound(normalizedBarcode);
        }

        Optional<OpenFoodFactsProduct> externalProduct = openFoodFactsClient.findByBarcode(normalizedBarcode);
        if (externalProduct.isEmpty()) {
            return notFound(normalizedBarcode);
        }

        OpenFoodFactsProduct product = externalProduct.get();
        String suggestedName = buildSuggestedName(product);
        return BarcodeLookupResponse.builder()
                .status(BarcodeLookupStatus.EXTERNAL_MATCH)
                .barcode(normalizedBarcode)
                .suggestedName(suggestedName)
                .brand(firstBrand(product.brands()))
                .presentation(trimToNull(product.quantity()))
                .source(OPEN_FOOD_FACTS_SOURCE)
                .build();
    }

    private BarcodeLookupResponse notFound(String barcode) {
        return BarcodeLookupResponse.builder()
                .status(BarcodeLookupStatus.NOT_FOUND)
                .barcode(barcode)
                .build();
    }

    private String normalizeBarcode(String barcode) {
        if (barcode == null) {
            throw new IllegalArgumentException("El codigo de barras es obligatorio");
        }
        String normalizedBarcode = barcode.trim();
        if (normalizedBarcode.isEmpty()) {
            throw new IllegalArgumentException("El codigo de barras es obligatorio");
        }
        if (normalizedBarcode.length() > MAX_BARCODE_LENGTH) {
            throw new IllegalArgumentException("El codigo de barras no debe superar 50 caracteres");
        }
        return normalizedBarcode;
    }

    private boolean canLookupExternally(String barcode) {
        return barcode.matches(EXTERNAL_BARCODE_PATTERN);
    }

    private String buildSuggestedName(OpenFoodFactsProduct product) {
        String baseName = firstNonBlank(product.productNameEs(), product.productName());
        String brand = firstBrand(product.brands());
        String presentation = trimToNull(product.quantity());

        StringBuilder suggestedName = new StringBuilder(baseName);
        if (brand != null && !containsIgnoringCase(baseName, brand)) {
            suggestedName.append(" – ").append(brand);
        }
        if (presentation != null && !containsIgnoringCase(baseName, presentation)) {
            suggestedName.append(" – ").append(presentation);
        }
        return suggestedName.toString();
    }

    private String firstBrand(String brands) {
        String normalizedBrands = trimToNull(brands);
        if (normalizedBrands == null) {
            return null;
        }
        for (String brand : normalizedBrands.split(",")) {
            String normalizedBrand = trimToNull(brand);
            if (normalizedBrand != null) {
                return normalizedBrand;
            }
        }
        return null;
    }

    private boolean containsIgnoringCase(String value, String fragment) {
        return normalizeForDuplicateCheck(value).contains(normalizeForDuplicateCheck(fragment));
    }

    private String normalizeForDuplicateCheck(String value) {
        StringBuilder normalized = new StringBuilder();
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            if (Character.isLetterOrDigit(character)) {
                normalized.append(Character.toLowerCase(character));
            }
        }
        return normalized.toString();
    }

    private String firstNonBlank(String first, String second) {
        String normalizedFirst = trimToNull(first);
        if (normalizedFirst != null) {
            return normalizedFirst;
        }
        String normalizedSecond = trimToNull(second);
        if (normalizedSecond != null) {
            return normalizedSecond;
        }
        return null;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
