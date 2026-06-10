package com.campusflow.registration.repository;

import com.campusflow.registration.mongo.ActivityLogDocument;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ActivityLogRepository extends MongoRepository<ActivityLogDocument, String> {
    List<ActivityLogDocument> findTop100ByOrderByOccurredAtDesc();
    List<ActivityLogDocument> findTop100ByActorEmailOrderByOccurredAtDesc(String actorEmail);
    List<ActivityLogDocument> findByActionContainingIgnoreCaseAndSeverityContainingIgnoreCaseAndOccurredAtBetweenOrderByOccurredAtDesc(
        String action, String severity, LocalDateTime from, LocalDateTime to);
}
