package com.angelica.pos.dashboard.service;

import com.angelica.pos.dashboard.dto.DashboardSummaryResponse;
import com.angelica.pos.security.AuthenticatedUser;

public interface DashboardService {

    DashboardSummaryResponse getSummary(AuthenticatedUser authenticatedUser);
}
