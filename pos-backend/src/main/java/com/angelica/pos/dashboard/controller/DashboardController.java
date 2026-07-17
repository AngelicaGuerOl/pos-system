package com.angelica.pos.dashboard.controller;

import com.angelica.pos.dashboard.dto.DashboardSummaryResponse;
import com.angelica.pos.dashboard.service.DashboardService;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.config.OpenApiTags;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = OpenApiTags.DASHBOARD)
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(dashboardService.getSummary(authenticatedUser));
    }
}
