package com.campusflow.registration.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class ActivityLogResponse {
    private String id;
    private String actorEmail;
    private String actorName;
    private String actorType;
    private String action;
    private String severity;
    private String source;
    private String ipAddress;
    private String message;
    private Map<String, Object> metadata;
    private LocalDateTime occurredAt;
    private Double score;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorType() { return actorType; }
    public void setActorType(String actorType) { this.actorType = actorType; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
}
