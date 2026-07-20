package com.angelica.pos.catalog.product.external;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties(OpenFoodFactsConfig.OpenFoodFactsProperties.class)
public class OpenFoodFactsConfig {

    @Bean
    RestClient openFoodFactsRestClient(OpenFoodFactsProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(2));
        requestFactory.setReadTimeout(Duration.ofSeconds(3));

        return RestClient.builder()
                .baseUrl(properties.baseUrl())
                .defaultHeader("User-Agent", properties.userAgent())
                .requestFactory(requestFactory)
                .build();
    }

    @ConfigurationProperties(prefix = "app.open-food-facts")
    public record OpenFoodFactsProperties(
            String baseUrl,
            String userAgent
    ) {
    }
}
