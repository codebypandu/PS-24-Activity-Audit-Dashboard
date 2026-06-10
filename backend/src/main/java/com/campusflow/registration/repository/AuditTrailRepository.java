package com.campusflow.registration.repository;

import com.campusflow.registration.mongo.AuditTrailDocument;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AuditTrailRepository extends MongoRepository<AuditTrailDocument, String> {
    List<AuditTrailDocument> findTop100ByOrderByCreatedAtDesc();
    List<AuditTrailDocument> findTop100ByActorEmailOrderByCreatedAtDesc(String actorEmail);
}
