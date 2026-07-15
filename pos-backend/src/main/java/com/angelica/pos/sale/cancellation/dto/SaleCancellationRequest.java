package com.angelica.pos.sale.cancellation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SaleCancellationRequest {

    @NotBlank(message = "Reason is required")
    private String reason;
}
