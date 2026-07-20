package com.angelica.pos.catalog.product.external;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withResourceNotFound;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenFoodFactsClientTest {

    private MockRestServiceServer server;
    private OpenFoodFactsClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl("https://world.openfoodfacts.test")
                .defaultHeader("User-Agent", "NovaPOS/1.0 test");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new OpenFoodFactsClient(builder.build());
    }

    @Test
    void findByBarcodeRequestsOnlyRequiredFieldsAndReturnsProduct() {
        server.expect(requestTo("https://world.openfoodfacts.test/api/v3/product/7500000000000?fields=code,product_name_es,product_name,brands,quantity"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("User-Agent", "NovaPOS/1.0 test"))
                .andRespond(withSuccess("""
                        {
                          "code": "7500000000000",
                          "product": {
                            "code": "7500000000000",
                            "product_name_es": "Nombre",
                            "product_name": "Name",
                            "brands": "Marca",
                            "quantity": "600 ml",
                            "ignored": "value"
                          }
                        }
                        """, MediaType.APPLICATION_JSON));

        Optional<OpenFoodFactsProduct> result = client.findByBarcode("7500000000000");

        assertTrue(result.isPresent());
        assertEquals("Nombre", result.get().productNameEs());
        assertEquals("Name", result.get().productName());
        assertEquals("Marca", result.get().brands());
        assertEquals("600 ml", result.get().quantity());
        server.verify();
    }

    @Test
    void findByBarcodeReturnsEmptyForProductWithoutValidName() {
        server.expect(requestTo("https://world.openfoodfacts.test/api/v3/product/7500000000000?fields=code,product_name_es,product_name,brands,quantity"))
                .andRespond(withSuccess("""
                        {
                          "code": "7500000000000",
                          "product": {
                            "code": "7500000000000",
                            "product_name_es": " ",
                            "product_name": ""
                          }
                        }
                        """, MediaType.APPLICATION_JSON));

        Optional<OpenFoodFactsProduct> result = client.findByBarcode("7500000000000");

        assertTrue(result.isEmpty());
        server.verify();
    }

    @Test
    void findByBarcodeReturnsEmptyFor404() {
        server.expect(requestTo("https://world.openfoodfacts.test/api/v3/product/7500000000000?fields=code,product_name_es,product_name,brands,quantity"))
                .andRespond(withResourceNotFound());

        Optional<OpenFoodFactsProduct> result = client.findByBarcode("7500000000000");

        assertTrue(result.isEmpty());
        server.verify();
    }

    @Test
    void findByBarcodeThrowsUnavailableFor429() {
        server.expect(requestTo("https://world.openfoodfacts.test/api/v3/product/7500000000000?fields=code,product_name_es,product_name,brands,quantity"))
                .andRespond(withStatus(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS));

        assertThrows(ExternalProductCatalogUnavailableException.class, () -> client.findByBarcode("7500000000000"));
        server.verify();
    }

    @Test
    void findByBarcodeThrowsUnavailableFor5xx() {
        server.expect(requestTo("https://world.openfoodfacts.test/api/v3/product/7500000000000?fields=code,product_name_es,product_name,brands,quantity"))
                .andRespond(withStatus(org.springframework.http.HttpStatus.BAD_GATEWAY));

        assertThrows(ExternalProductCatalogUnavailableException.class, () -> client.findByBarcode("7500000000000"));
        server.verify();
    }
}
