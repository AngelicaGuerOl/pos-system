package com.angelica.pos.shared.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@Schema(description = "Respuesta paginada estándar. La página es base cero.")
public class PageResponse<T> {

    @Schema(description = "Elementos de la página actual")
    private List<T> content;

    @Schema(description = "Número de página base cero", example = "0")
    private int page;

    @Schema(description = "Tamaño de página solicitado", example = "10")
    private int size;

    @Schema(description = "Total de elementos disponibles", example = "125")
    private long totalElements;

    @Schema(description = "Total de páginas disponibles", example = "13")
    private int totalPages;

    @Schema(description = "Indica si es la primera página", example = "true")
    private boolean first;

    @Schema(description = "Indica si es la última página", example = "false")
    private boolean last;
}
