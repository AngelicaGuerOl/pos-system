package com.angelica.pos.catalog.product.external;

import java.util.Map;

public record OpenFoodFactsResponse(
        String code,
        String status,
        OpenFoodFactsProduct product
) {

    public static OpenFoodFactsResponse from(Map<String, Object> body) {
        if (body == null) {
            return new OpenFoodFactsResponse(null, null, null);
        }

        return new OpenFoodFactsResponse(
                asText(body.get("code")),
                asText(body.get("status")),
                OpenFoodFactsProduct.from(body.get("product"))
        );
    }

    private static String asText(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }
}
