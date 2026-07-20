package com.angelica.pos.catalog.product.external;

import java.util.Map;

public record OpenFoodFactsProduct(
        String code,
        String productNameEs,
        String productName,
        String brands,
        String quantity
) {

    static OpenFoodFactsProduct from(Object value) {
        if (!(value instanceof Map<?, ?> product)) {
            return null;
        }

        return new OpenFoodFactsProduct(
                asText(product.get("code")),
                asText(product.get("product_name_es")),
                asText(product.get("product_name")),
                asText(product.get("brands")),
                asText(product.get("quantity"))
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
