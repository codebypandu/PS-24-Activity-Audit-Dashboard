package com.campusflow.registration.mongo;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "log_embeddings")
public class LogEmbeddingDocument {

    @Id
    private String id;
    private String activityLogId;
    private String text;
    private List<Double> embedding;
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getActivityLogId() { return activityLogId; }
    public void setActivityLogId(String activityLogId) { this.activityLogId = activityLogId; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public List<Double> getEmbedding() { return embedding; }
    public void setEmbedding(List<Double> embedding) { this.embedding = embedding; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
