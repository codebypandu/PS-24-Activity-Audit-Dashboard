package com.campusflow.registration.service;

import com.campusflow.registration.dto.ActivityLogRequest;
import com.campusflow.registration.dto.ActivityLogResponse;
import com.campusflow.registration.dto.ActivitySummaryResponse;
import com.campusflow.registration.dto.AuditTrailResponse;
import com.campusflow.registration.model.ActivitySummary;
import com.campusflow.registration.model.ActorType;
import com.campusflow.registration.model.Severity;
import com.campusflow.registration.model.User;
import com.campusflow.registration.mongo.ActivityLogDocument;
import com.campusflow.registration.mongo.AuditTrailDocument;
import com.campusflow.registration.mongo.LogEmbeddingDocument;
import com.campusflow.registration.repository.ActivityLogRepository;
import com.campusflow.registration.repository.ActivitySummaryRepository;
import com.campusflow.registration.repository.AuditTrailRepository;
import com.campusflow.registration.repository.LogEmbeddingRepository;
import com.campusflow.registration.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final AuditTrailRepository auditTrailRepository;
    private final LogEmbeddingRepository logEmbeddingRepository;
    private final ActivitySummaryRepository summaryRepository;
    private final UserRepository userRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository,
                              AuditTrailRepository auditTrailRepository,
                              LogEmbeddingRepository logEmbeddingRepository,
                              ActivitySummaryRepository summaryRepository,
                              UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.auditTrailRepository = auditTrailRepository;
        this.logEmbeddingRepository = logEmbeddingRepository;
        this.summaryRepository = summaryRepository;
        this.userRepository = userRepository;
    }

    public ActivityLogResponse create(ActivityLogRequest request, Authentication authentication) {
        User user = findCurrentUser(authentication);
        ActorType actorType = ActorType.valueOf(request.getActorType().toUpperCase(Locale.ROOT));
        Severity severity = Severity.valueOf(request.getSeverity().toUpperCase(Locale.ROOT));
        LocalDateTime now = LocalDateTime.now();

        ActivityLogDocument log = new ActivityLogDocument();
        log.setUserId(user.getId());
        log.setActorEmail(user.getEmail());
        log.setActorName(user.getFullName());
        log.setActorType(actorType.name());
        log.setAction(clean(request.getAction()));
        log.setSeverity(severity.name());
        log.setSource(clean(request.getSource()));
        log.setIpAddress(cleanNullable(request.getIpAddress()));
        log.setMessage(clean(request.getMessage()));
        log.setMetadata(request.getMetadata());
        log.setOccurredAt(now);
        ActivityLogDocument saved = activityLogRepository.save(log);

        AuditTrailDocument audit = new AuditTrailDocument();
        audit.setActivityLogId(saved.getId());
        audit.setActorEmail(user.getEmail());
        audit.setEventName("LOG_CREATED");
        audit.setPreviousState(request.getPreviousState());
        audit.setNewState(request.getNewState() == null ? saved.getSeverity() : request.getNewState());
        audit.setChanges(request.getMetadata());
        audit.setCreatedAt(now);
        auditTrailRepository.save(audit);

        LogEmbeddingDocument embedding = new LogEmbeddingDocument();
        embedding.setActivityLogId(saved.getId());
        embedding.setText(searchText(saved));
        embedding.setEmbedding(embed(searchText(saved)));
        embedding.setCreatedAt(now);
        logEmbeddingRepository.save(embedding);

        upsertSummary(user, saved, actorType, severity, now);
        return map(saved, null);
    }

    public List<ActivityLogResponse> list(String action, String severity, String from, String to, Authentication authentication) {
        List<ActivityLogDocument> logs;
        if (hasText(action) || hasText(severity) || hasText(from) || hasText(to)) {
            LocalDateTime fromTime = hasText(from) ? LocalDateTime.parse(from) : LocalDateTime.now().minusYears(5);
            LocalDateTime toTime = hasText(to) ? LocalDateTime.parse(to) : LocalDateTime.now().plusDays(1);
            logs = activityLogRepository.findByActionContainingIgnoreCaseAndSeverityContainingIgnoreCaseAndOccurredAtBetweenOrderByOccurredAtDesc(
                action == null ? "" : action,
                severity == null ? "" : severity,
                fromTime,
                toTime
            );
        } else if (isAdmin(authentication)) {
            logs = activityLogRepository.findTop100ByOrderByOccurredAtDesc();
        } else {
            logs = activityLogRepository.findTop100ByActorEmailOrderByOccurredAtDesc(authentication.getName());
        }

        if (!isAdmin(authentication)) {
            logs = logs.stream().filter(log -> authentication.getName().equals(log.getActorEmail())).toList();
        }
        return logs.stream().map(log -> map(log, null)).toList();
    }

    public List<ActivityLogResponse> semanticSearch(String query, Authentication authentication) {
        List<Double> queryEmbedding = embed(query);
        return logEmbeddingRepository.findAll().stream()
            .map(item -> {
                ActivityLogDocument log = activityLogRepository.findById(item.getActivityLogId()).orElse(null);
                if (log == null || (!isAdmin(authentication) && !authentication.getName().equals(log.getActorEmail()))) {
                    return null;
                }
                return map(log, cosine(queryEmbedding, item.getEmbedding()));
            })
            .filter(response -> response != null)
            .sorted(Comparator.comparing(ActivityLogResponse::getScore).reversed())
            .limit(10)
            .toList();
    }

    public List<ActivitySummaryResponse> summaries(Authentication authentication) {
        List<ActivitySummary> summaries = isAdmin(authentication)
            ? summaryRepository.findAllByOrderByLastEventAtDesc()
            : summaryRepository.findByUserOrderByLastEventAtDesc(findCurrentUser(authentication));
        return summaries.stream().map(this::mapSummary).toList();
    }

    public List<AuditTrailResponse> auditTrails(Authentication authentication) {
        List<AuditTrailDocument> trails = isAdmin(authentication)
            ? auditTrailRepository.findTop100ByOrderByCreatedAtDesc()
            : auditTrailRepository.findTop100ByActorEmailOrderByCreatedAtDesc(authentication.getName());
        return trails.stream().map(this::mapAudit).toList();
    }

    private void upsertSummary(User user, ActivityLogDocument log, ActorType actorType, Severity severity, LocalDateTime now) {
        ActivitySummary summary = summaryRepository
            .findByUserAndActionIgnoreCaseAndActorTypeAndSeverityAndSourceIgnoreCase(
                user, log.getAction(), actorType, severity, log.getSource())
            .orElseGet(ActivitySummary::new);
        summary.setUser(user);
        summary.setAction(log.getAction());
        summary.setActorType(actorType);
        summary.setSeverity(severity);
        summary.setSource(log.getSource());
        summary.setTotalEvents(summary.getTotalEvents() == null ? 1 : summary.getTotalEvents() + 1);
        summary.setLastEventAt(now);
        summaryRepository.save(summary);
    }

    private User findCurrentUser(Authentication authentication) {
        return userRepository.findByEmailIgnoreCase(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Authenticated user not found"));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    private ActivityLogResponse map(ActivityLogDocument log, Double score) {
        ActivityLogResponse response = new ActivityLogResponse();
        response.setId(log.getId());
        response.setActorEmail(log.getActorEmail());
        response.setActorName(log.getActorName());
        response.setActorType(log.getActorType());
        response.setAction(log.getAction());
        response.setSeverity(log.getSeverity());
        response.setSource(log.getSource());
        response.setIpAddress(log.getIpAddress());
        response.setMessage(log.getMessage());
        response.setMetadata(log.getMetadata());
        response.setOccurredAt(log.getOccurredAt());
        response.setScore(score);
        return response;
    }

    private ActivitySummaryResponse mapSummary(ActivitySummary summary) {
        ActivitySummaryResponse response = new ActivitySummaryResponse();
        response.setId(summary.getId());
        response.setActorEmail(summary.getUser() == null ? "system" : summary.getUser().getEmail());
        response.setAction(summary.getAction());
        response.setActorType(summary.getActorType().name());
        response.setSeverity(summary.getSeverity().name());
        response.setSource(summary.getSource());
        response.setTotalEvents(summary.getTotalEvents());
        response.setLastEventAt(summary.getLastEventAt());
        return response;
    }

    private AuditTrailResponse mapAudit(AuditTrailDocument audit) {
        AuditTrailResponse response = new AuditTrailResponse();
        response.setId(audit.getId());
        response.setActivityLogId(audit.getActivityLogId());
        response.setActorEmail(audit.getActorEmail());
        response.setEventName(audit.getEventName());
        response.setPreviousState(audit.getPreviousState());
        response.setNewState(audit.getNewState());
        response.setChanges(audit.getChanges());
        response.setCreatedAt(audit.getCreatedAt());
        return response;
    }

    private String searchText(ActivityLogDocument log) {
        return String.join(" ", log.getAction(), log.getSeverity(), log.getSource(), log.getMessage());
    }

    private List<Double> embed(String text) {
        double[] vector = new double[16];
        String normalized = text == null ? "" : text.toLowerCase(Locale.ROOT);
        for (String token : normalized.split("[^a-z0-9]+")) {
            if (token.isBlank()) {
                continue;
            }
            int bucket = Math.floorMod(token.hashCode(), vector.length);
            vector[bucket] += 1.0;
        }
        double length = Math.sqrt(java.util.Arrays.stream(vector).map(value -> value * value).sum());
        return java.util.Arrays.stream(vector)
            .map(value -> length == 0 ? 0 : value / length)
            .boxed()
            .toList();
    }

    private double cosine(List<Double> left, List<Double> right) {
        double score = 0;
        for (int i = 0; i < Math.min(left.size(), right.size()); i += 1) {
            score += left.get(i) * right.get(i);
        }
        return score;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String clean(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String cleanNullable(String value) {
        return value == null || value.isBlank() ? null : clean(value);
    }
}
