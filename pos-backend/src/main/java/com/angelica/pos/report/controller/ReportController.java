package com.angelica.pos.report.controller;

import com.angelica.pos.report.dto.OperationsSummaryResponse;
import com.angelica.pos.report.service.ReportService;
import com.angelica.pos.shared.config.OpenApiTags;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Validated
@Tag(name = OpenApiTags.REPORTS)
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/operations-summary")
    public ResponseEntity<OperationsSummaryResponse> getOperationsSummary(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,
            @RequestParam(required = false)
            Long cashierId
    ) {
        return ResponseEntity.ok(reportService.getOperationsSummary(from, to, cashierId));
    }
}
