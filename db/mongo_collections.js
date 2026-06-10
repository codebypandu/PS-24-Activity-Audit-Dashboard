if (!db.getCollectionNames().includes("activity_logs")) {
  db.createCollection("activity_logs");
}

if (!db.getCollectionNames().includes("audit_trails")) {
  db.createCollection("audit_trails");
}

if (!db.getCollectionNames().includes("log_embeddings")) {
  db.createCollection("log_embeddings");
}

db.activity_logs.createIndex({ actorEmail: 1, occurredAt: -1 });
db.activity_logs.createIndex({ action: 1, severity: 1, occurredAt: -1 });
db.activity_logs.createIndex({ message: "text", action: "text", source: "text" });

db.audit_trails.createIndex({ activityLogId: 1, createdAt: -1 });
db.audit_trails.createIndex({ actorEmail: 1, createdAt: -1 });

db.log_embeddings.createIndex({ activityLogId: 1 }, { unique: true });

const activityLogs = [
  {
    _id: ObjectId("665000000000000000000001"),
    actorEmail: "admin@audit.local",
    actorType: "USER",
    action: "LOGIN_SUCCESS",
    severity: "LOW",
    source: "auth-service",
    message: "Admin user signed in successfully from trusted workstation.",
    ipAddress: "192.168.1.15",
    metadata: { browser: "Chrome", module: "Authentication" },
    occurredAt: ISODate("2026-06-08T09:10:00Z")
  },
  {
    _id: ObjectId("665000000000000000000002"),
    actorEmail: "unknown@external.test",
    actorType: "USER",
    action: "LOGIN_FAILED",
    severity: "HIGH",
    source: "auth-service",
    message: "Unauthorized access attempt detected after multiple failed password entries.",
    ipAddress: "203.0.113.42",
    metadata: { attempts: 5, module: "Authentication" },
    occurredAt: ISODate("2026-06-08T09:18:00Z")
  },
  {
    _id: ObjectId("665000000000000000000003"),
    actorEmail: "system@audit.local",
    actorType: "SYSTEM",
    action: "CONFIG_CHANGED",
    severity: "MEDIUM",
    source: "configuration-service",
    message: "System retention policy changed from 30 days to 90 days.",
    ipAddress: "127.0.0.1",
    metadata: { setting: "logRetentionDays", oldValue: 30, newValue: 90 },
    occurredAt: ISODate("2026-06-08T09:35:00Z")
  },
  {
    _id: ObjectId("665000000000000000000004"),
    actorEmail: "analyst@audit.local",
    actorType: "USER",
    action: "EXPORT_AUDIT_REPORT",
    severity: "MEDIUM",
    source: "audit-dashboard",
    message: "Security analyst exported audit trail report for compliance review.",
    ipAddress: "192.168.1.28",
    metadata: { format: "CSV", records: 128 },
    occurredAt: ISODate("2026-06-08T10:05:00Z")
  },
  {
    _id: ObjectId("665000000000000000000005"),
    actorEmail: "system@audit.local",
    actorType: "SYSTEM",
    action: "ALERT_RAISED",
    severity: "CRITICAL",
    source: "monitoring-service",
    message: "Critical alert raised for repeated unauthorized access attempts.",
    ipAddress: "127.0.0.1",
    metadata: { rule: "FAILED_LOGIN_THRESHOLD", count: 12 },
    occurredAt: ISODate("2026-06-08T10:20:00Z")
  }
];

db.activity_logs.deleteMany({});
db.audit_trails.deleteMany({});
db.log_embeddings.deleteMany({});

db.activity_logs.insertMany(activityLogs);

db.audit_trails.insertMany([
  {
    activityLogId: "665000000000000000000001",
    actorEmail: "admin@audit.local",
    eventName: "AUTHENTICATION",
    previousState: null,
    newState: "SIGNED_IN",
    changes: { status: "SIGNED_IN" },
    createdAt: ISODate("2026-06-08T09:10:02Z")
  },
  {
    activityLogId: "665000000000000000000002",
    actorEmail: "unknown@external.test",
    eventName: "SECURITY",
    previousState: "failedAttempts=4",
    newState: "failedAttempts=5, accountLocked=false",
    changes: { failedAttempts: 5, accountLocked: false },
    createdAt: ISODate("2026-06-08T09:18:04Z")
  },
  {
    activityLogId: "665000000000000000000003",
    actorEmail: "system@audit.local",
    eventName: "CONFIGURATION",
    previousState: "logRetentionDays=30",
    newState: "logRetentionDays=90",
    changes: { logRetentionDays: 90 },
    createdAt: ISODate("2026-06-08T09:35:03Z")
  },
  {
    activityLogId: "665000000000000000000004",
    actorEmail: "analyst@audit.local",
    eventName: "DATA_EXPORT",
    previousState: null,
    newState: "CSV_EXPORT",
    changes: { report: "audit-trail", format: "CSV" },
    createdAt: ISODate("2026-06-08T10:05:05Z")
  },
  {
    activityLogId: "665000000000000000000005",
    actorEmail: "system@audit.local",
    eventName: "ALERT",
    previousState: "alertOpen=false",
    newState: "alertOpen=true, severity=CRITICAL",
    changes: { alertOpen: true, severity: "CRITICAL" },
    createdAt: ISODate("2026-06-08T10:20:01Z")
  }
]);

db.log_embeddings.insertMany([
  {
    activityLogId: "665000000000000000000001",
    text: "Admin user signed in successfully from trusted workstation.",
    embedding: [0.08, 0.11, 0.02, 0.04, 0.09, 0.03, 0.01, 0.07, 0.12, 0.05, 0.02, 0.06, 0.01, 0.03, 0.04, 0.08],
    createdAt: ISODate("2026-06-08T09:10:03Z")
  },
  {
    activityLogId: "665000000000000000000002",
    text: "Unauthorized access attempt detected after multiple failed password entries.",
    embedding: [0.91, 0.87, 0.75, 0.68, 0.33, 0.21, 0.94, 0.81, 0.79, 0.62, 0.55, 0.48, 0.36, 0.29, 0.44, 0.72],
    createdAt: ISODate("2026-06-08T09:18:05Z")
  },
  {
    activityLogId: "665000000000000000000003",
    text: "System retention policy changed from 30 days to 90 days.",
    embedding: [0.18, 0.24, 0.82, 0.88, 0.76, 0.69, 0.22, 0.31, 0.47, 0.93, 0.86, 0.71, 0.64, 0.58, 0.35, 0.41],
    createdAt: ISODate("2026-06-08T09:35:04Z")
  },
  {
    activityLogId: "665000000000000000000004",
    text: "Security analyst exported audit trail report for compliance review.",
    embedding: [0.37, 0.44, 0.29, 0.21, 0.66, 0.74, 0.35, 0.48, 0.52, 0.27, 0.39, 0.83, 0.91, 0.57, 0.46, 0.33],
    createdAt: ISODate("2026-06-08T10:05:06Z")
  },
  {
    activityLogId: "665000000000000000000005",
    text: "Critical alert raised for repeated unauthorized access attempts.",
    embedding: [0.96, 0.89, 0.78, 0.73, 0.41, 0.38, 0.98, 0.84, 0.88, 0.67, 0.61, 0.52, 0.43, 0.34, 0.57, 0.80],
    createdAt: ISODate("2026-06-08T10:20:02Z")
  }
]);

print("MongoDB activity audit seed data inserted successfully");

// MongoDB Atlas vector index definition for semantic log search:
// {
//   "fields": [
//     {
//       "type": "vector",
//       "path": "embedding",
//       "numDimensions": 16,
//       "similarity": "cosine"
//     }
//   ]
// }
