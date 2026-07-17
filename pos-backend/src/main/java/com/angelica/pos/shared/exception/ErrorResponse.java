package com.angelica.pos.shared.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.Map;

@Getter
@Builder
@Schema(description = "Respuesta estándar de error generada por GlobalExceptionHandler")
public class ErrorResponse {

    @Schema(description = "Fecha y hora del error", example = "2026-07-17T12:00:00-06:00")
    private OffsetDateTime timestamp;

    @Schema(description = "Código HTTP", example = "400")
    private int status;

    @Schema(description = "Nombre del estado HTTP", example = "Bad Request")
    private String error;

    @Schema(description = "Mensaje legible del error", example = "La solicitud no es valida. Revisa los datos ingresados.")
    private String message;

    @Schema(description = "Ruta solicitada", example = "/api/products")
    private String path;

    @Schema(description = "Errores de validación por campo, cuando existen", nullable = true)
    private Map<String, String> validationErrors;
}
