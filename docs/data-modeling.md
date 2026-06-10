# 2. Data Modeling, Classification, and Normalization

## Initial Unnormalized Design

An early draft might store everything in one table:

`activity_log_raw`

- actor name
- actor email
- role
- action
- actor type
- severity
- source
- message
- old state
- new state
- metadata
- embedding values
- timestamp

### Problems

- Authentication data is mixed with event data
- Large log messages and metadata do not fit clean relational tables
- Embedding vectors are awkward in normalized SQL rows
- Repeated actions create summary duplication

## SQL vs MongoDB Classification

### PostgreSQL

Use PostgreSQL for:

- users
- activity_summary

### Why SQL

- Structured identity and summary data
- Strong constraints for user ownership
- Fast aggregate dashboard cards
- Suitable for relational reporting

### MongoDB

Use MongoDB for:

- activity_logs
- audit_trails
- log_embeddings

### Why MongoDB

- Activity logs can include flexible metadata
- Audit trail documents can preserve state changes naturally
- Embedding vectors fit the vector-search requirement

## Normalization

### 1NF

- All attributes become atomic
- No repeating groups

### 2NF

- Non-key attributes depend on the whole primary key
- Summary records separated from raw event records

### 3NF

- Remove transitive dependencies
- Audit trail metadata stays in MongoDB with activity log references
- Authentication data stays in `users`

## Final Normalized Relational Schema

### `users`

- `id` PK
- `full_name`
- `email` unique
- `password_hash`
- `role`
- `created_at`

### `activity_summary`

- `id` PK
- `user_id` nullable FK -> users.id
- `action`
- `actor_type`
- `severity`
- `source`
- `total_events`
- `last_event_at`

## MongoDB Collections

### `activity_logs`

- detailed activity events
- actor identity snapshot
- severity, source, IP, message, metadata
- occurred timestamp

### `audit_trails`

- activity log reference
- actor email
- event name
- previous and new state
- changed fields

### `log_embeddings`

- activity log reference
- searchable text
- vector embedding
- created timestamp

## Node.js Backend Store

The separate Node.js backend stores Review 3 CRUD demonstration records in JSON files:

- `node-backend/data/logs.json`
- `node-backend/data/audit_trails.json`

This keeps the Node service independent and easy to run while the main production-style database design remains PostgreSQL plus MongoDB.

## Why Normalization Helped

- Removed redundancy
- Reduced update anomalies
- Improved data integrity
- Made authentication, summary, log detail, and semantic search responsibilities clear
