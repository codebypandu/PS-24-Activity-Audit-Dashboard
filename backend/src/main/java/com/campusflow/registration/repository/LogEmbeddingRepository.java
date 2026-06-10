package com.campusflow.registration.repository;

import com.campusflow.registration.mongo.LogEmbeddingDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LogEmbeddingRepository extends MongoRepository<LogEmbeddingDocument, String> {
}
