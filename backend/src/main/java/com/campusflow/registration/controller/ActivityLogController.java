package com.campusflow.registration.controller;

import com.campusflow.registration.dto.ActivityLogRequest;
import com.campusflow.registration.dto.ActivityLogResponse;
import com.campusflow.registration.dto.ActivitySummaryResponse;
import com.campusflow.registration.dto.AuditTrailResponse;
import com.campusflow.registration.service.ActivityLogService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/logs")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @PostMapping
    public ActivityLogResponse create(@Valid @RequestBody ActivityLogRequest request, Authentication authentication) {
        return activityLogService.create(request, authentication);
    }

    @GetMapping
    public List<ActivityLogResponse> list(@RequestParam(required = false) String action,
                                          @RequestParam(required = false) String severity,
                                          @RequestParam(required = false) String from,
                                          @RequestParam(required = false) String to,
                                          Authentication authentication) {
        return activityLogService.list(action, severity, from, to, authentication);
    }

    @GetMapping("/search")
    public List<ActivityLogResponse> search(@RequestParam String q, Authentication authentication) {
        return activityLogService.semanticSearch(q, authentication);
    }

    @GetMapping("/summary")
    public List<ActivitySummaryResponse> summary(Authentication authentication) {
        return activityLogService.summaries(authentication);
    }

    @GetMapping("/audit-trails")
    public List<AuditTrailResponse> auditTrails(Authentication authentication) {
        return activityLogService.auditTrails(authentication);
    }
}
