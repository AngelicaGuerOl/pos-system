package com.angelica.pos.catalog.product.service;

import com.angelica.pos.catalog.product.dto.BarcodeLookupResponse;
import com.angelica.pos.catalog.product.dto.BarcodeLookupStatus;
import com.angelica.pos.catalog.product.dto.ProductResponse;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.external.OpenFoodFactsClient;
import com.angelica.pos.catalog.product.external.OpenFoodFactsProduct;
import com.angelica.pos.catalog.product.mapper.ProductMapper;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BarcodeLookupServiceImplTest {

    private ProductRepository productRepository;
    private ProductMapper productMapper;
    private OpenFoodFactsClient openFoodFactsClient;
    private BarcodeLookupServiceImpl barcodeLookupService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        productMapper = mock(ProductMapper.class);
        openFoodFactsClient = mock(OpenFoodFactsClient.class);
        barcodeLookupService = new BarcodeLookupServiceImpl(productRepository, productMapper, openFoodFactsClient);
    }

    @Test
    void lookupReturnsActiveLocalProductWithoutCallingExternalCatalog() {
        Product product = Product.builder().id(10L).barcode("0123456789012").active(true).build();
        ProductResponse productResponse = new ProductResponse();
        productResponse.setId(10L);
        productResponse.setBarcode("0123456789012");

        when(productRepository.findByBarcodeIgnoreCase("0123456789012")).thenReturn(Optional.of(product));
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        BarcodeLookupResponse response = barcodeLookupService.lookup(" 0123456789012 ");

        assertEquals(BarcodeLookupStatus.LOCAL_PRODUCT_EXISTS, response.getStatus());
        assertEquals("0123456789012", response.getBarcode());
        assertEquals(10L, response.getExistingProductId());
        assertEquals(true, response.getExistingProductActive());
        assertEquals(productResponse, response.getExistingProduct());
        verify(openFoodFactsClient, never()).findByBarcode("0123456789012");
    }

    @Test
    void lookupReturnsInactiveLocalProductWithoutCallingExternalCatalog() {
        Product product = Product.builder().id(11L).barcode("7500000000000").active(false).build();

        when(productRepository.findByBarcodeIgnoreCase("7500000000000")).thenReturn(Optional.of(product));

        BarcodeLookupResponse response = barcodeLookupService.lookup("7500000000000");

        assertEquals(BarcodeLookupStatus.LOCAL_PRODUCT_EXISTS, response.getStatus());
        assertEquals(false, response.getExistingProductActive());
        verify(openFoodFactsClient, never()).findByBarcode("7500000000000");
    }

    @Test
    void lookupPrefersSpanishExternalProductName() {
        when(productRepository.findByBarcodeIgnoreCase("7500000000000")).thenReturn(Optional.empty());
        when(openFoodFactsClient.findByBarcode("7500000000000")).thenReturn(Optional.of(new OpenFoodFactsProduct(
                "7500000000000",
                "Nombre en espanol",
                "English name",
                "Marca",
                "600 ml"
        )));

        BarcodeLookupResponse response = barcodeLookupService.lookup("7500000000000");

        assertEquals(BarcodeLookupStatus.EXTERNAL_MATCH, response.getStatus());
        assertEquals("Nombre en espanol – Marca – 600 ml", response.getSuggestedName());
        assertEquals("Marca", response.getBrand());
        assertEquals("600 ml", response.getPresentation());
        assertEquals("OPEN_FOOD_FACTS", response.getSource());
    }

    @Test
    void lookupUsesProductNameFallback() {
        when(productRepository.findByBarcodeIgnoreCase("7500000000000")).thenReturn(Optional.empty());
        when(openFoodFactsClient.findByBarcode("7500000000000")).thenReturn(Optional.of(new OpenFoodFactsProduct(
                "7500000000000",
                null,
                "Fallback name",
                null,
                null
        )));

        BarcodeLookupResponse response = barcodeLookupService.lookup("7500000000000");

        assertEquals(BarcodeLookupStatus.EXTERNAL_MATCH, response.getStatus());
        assertEquals("Fallback name", response.getSuggestedName());
    }

    @Test
    void lookupBuildsSuggestedNameWithFirstBrandAndPresentation() {
        when(productRepository.findByBarcodeIgnoreCase("7500000000000")).thenReturn(Optional.empty());
        when(openFoodFactsClient.findByBarcode("7500000000000")).thenReturn(Optional.of(new OpenFoodFactsProduct(
                "7500000000000",
                " Kinder Delice paquete individual ",
                null,
                " Ferrero, Kinder ",
                " 39 g "
        )));

        BarcodeLookupResponse response = barcodeLookupService.lookup("7500000000000");

        assertEquals("Kinder Delice paquete individual – Ferrero – 39 g", response.getSuggestedName());
        assertEquals("Ferrero", response.getBrand());
        assertEquals("39 g", response.getPresentation());
    }

    @Test
    void lookupDoesNotDuplicateBrandAlreadyPresentInName() {
        when(productRepository.findByBarcodeIgnoreCase("7500000000000")).thenReturn(Optional.empty());
        when(openFoodFactsClient.findByBarcode("7500000000000")).thenReturn(Optional.of(new OpenFoodFactsProduct(
                "7500000000000",
                "Coca cola",
                null,
                "Coca-cola",
                "3L"
        )));

        BarcodeLookupResponse response = barcodeLookupService.lookup("7500000000000");

        assertEquals("Coca cola – 3L", response.getSuggestedName());
        assertEquals("Coca-cola", response.getBrand());
        assertEquals("3L", response.getPresentation());
    }

    @Test
    void lookupDoesNotDuplicateBrandOrPresentationAlreadyPresentInName() {
        when(productRepository.findByBarcodeIgnoreCase("7500000000000")).thenReturn(Optional.empty());
        when(openFoodFactsClient.findByBarcode("7500000000000")).thenReturn(Optional.of(new OpenFoodFactsProduct(
                "7500000000000",
                "Coca-Cola 3L",
                null,
                "Coca-Cola",
                "3L"
        )));

        BarcodeLookupResponse response = barcodeLookupService.lookup("7500000000000");

        assertEquals("Coca-Cola 3L", response.getSuggestedName());
        assertEquals("Coca-Cola", response.getBrand());
        assertEquals("3L", response.getPresentation());
    }

    @Test
    void lookupDoesNotAddSeparatorsForBlankBrandOrPresentation() {
        when(productRepository.findByBarcodeIgnoreCase("7500000000000")).thenReturn(Optional.empty());
        when(openFoodFactsClient.findByBarcode("7500000000000")).thenReturn(Optional.of(new OpenFoodFactsProduct(
                "7500000000000",
                "Producto",
                null,
                " ",
                ""
        )));

        BarcodeLookupResponse response = barcodeLookupService.lookup("7500000000000");

        assertEquals("Producto", response.getSuggestedName());
        assertNull(response.getBrand());
        assertNull(response.getPresentation());
    }

    @Test
    void lookupReturnsNotFoundForInvalidExternalBarcodeWithoutCallingExternalCatalog() {
        when(productRepository.findByBarcodeIgnoreCase("ABC123")).thenReturn(Optional.empty());

        BarcodeLookupResponse response = barcodeLookupService.lookup("ABC123");

        assertEquals(BarcodeLookupStatus.NOT_FOUND, response.getStatus());
        assertEquals("ABC123", response.getBarcode());
        verify(openFoodFactsClient, never()).findByBarcode("ABC123");
    }

    @Test
    void lookupReturnsNotFoundWhenExternalCatalogHasNoProduct() {
        when(productRepository.findByBarcodeIgnoreCase("7500000000000")).thenReturn(Optional.empty());
        when(openFoodFactsClient.findByBarcode("7500000000000")).thenReturn(Optional.empty());

        BarcodeLookupResponse response = barcodeLookupService.lookup("7500000000000");

        assertEquals(BarcodeLookupStatus.NOT_FOUND, response.getStatus());
        assertNull(response.getSuggestedName());
    }
}
