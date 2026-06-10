package com.campusflow.registration.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public class ActivityLogRequest {

    @NotBlank(message = "Action is required")
    private String action;

    @NotBlank(message = "Actor type is required")
    private String actorType;

    @NotBlank(message = "Severity is required")
    private String severity;

    @NotBlank(message = "Source is required")
    private String source;

    private String ipAddress;

    @NotBlank(message = "Message is required")
    private String message;

    private String previousState;
    private String newState;
    private Map<String, Object> metadata;

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getActorType() { return actorType; }
    public void setActorType(String actorType) { this.actorType = actorType; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getPreviousState() { return previousState; }
    public void setPreviousState(String previousState) { this.previousState = previousState; }
    public String getNewState() { return newState; }
    public void setNewState(String newState) { this.newState = newState; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
