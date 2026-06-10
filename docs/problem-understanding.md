# 1. Problem Understanding

## Problem Statement

PS-24 requires a system that records and displays user and system activities for auditing and monitoring. The system must support log creation, audit-trail viewing, filtering/querying, action tracking, and intelligent search over activity logs.

## Functional Requirements

- User registration and login
- JWT-based authentication
- Role-based visibility for admin and analyst users
- Record user/system activities
- Store users and activity summaries in PostgreSQL
- Store activity logs, audit trails, and log embeddings in MongoDB
- Filter logs by action, severity, and date range
- View immutable audit trail entries
- Search logs semantically with natural-language queries
- Centralized API access using FastAPI gateway
- Node.js CRUD backend for Review 3 API development requirement

## Core Entities

- User
- Activity Summary
- Activity Log
- Audit Trail
- Log Embedding

## Key Data Variables

- Actor name and email
- Actor type: `USER` or `SYSTEM`
- Action
- Severity
- Source service
- IP address
- Log message
- Metadata and state change
- Occurred timestamp
- Embedding vector

## Workflow

1. User logs in
2. User records a platform activity
3. Backend writes the detailed activity log to MongoDB
4. Backend writes an audit trail entry to MongoDB
5. Backend stores searchable log vectors in MongoDB
6. Backend updates PostgreSQL activity summary
7. Dashboard displays summaries, filtered logs, audit trails, and semantic results
8. Dashboard can also create and view activity records through the Node.js CRUD API
