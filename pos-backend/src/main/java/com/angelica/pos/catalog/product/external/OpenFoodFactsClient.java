package com.angelica.pos.catalog.product.external;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OpenFoodFactsClient {

    private static final String FIELDS = "code,product_name_es,product_name,brands,quantity";

    private final RestClient openFoodFactsRestClient;

    public Optional<OpenFoodFactsProduct> findByBarcode(String barcode) {
        try {
            Map<String, Object> body = openFoodFactsRestClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v3/product/{barcode}")
                            .queryParam("fields", FIELDS)
                            .build(barcode))
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (request, externalResponse) -> {
                        if (externalResponse.getStatusCode().value() == 404) {
                            throw new OpenFoodFactsProductNotFoundException();
                        }
                        if (externalResponse.getStatusCode().value() == 429) {
                            throw new ExternalProductCatalogUnavailableException();
                        }
                        throw new OpenFoodFactsProductNotFoundException();
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (request, responseBody) -> {
                        throw new ExternalProductCatalogUnavailableException();
                    })
                    .body(new ParameterizedTypeReference<>() {});

            OpenFoodFactsResponse response = OpenFoodFactsResponse.from(body);

            if (response.product() == null || firstNonBlank(response.product().productNameEs(), response.product().productName()) == null) {
                return Optional.empty();
            }
            return Optional.of(response.product());
        } catch (OpenFoodFactsProductNotFoundException exception) {
            return Optional.empty();
        } catch (ExternalProductCatalogUnavailableException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new ExternalProductCatalogUnavailableException();
        }
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }

    private static class OpenFoodFactsProductNotFoundException extends RuntimeException {
    }
}
