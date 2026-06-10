# 3. Architecture and Justification

## Architecture

Frontend -> FastAPI Gateway -> Spring Boot -> PostgreSQL + MongoDB

Frontend -> FastAPI Gateway -> Node.js Backend -> JSON activity store

## Role of Each Layer

### Frontend

- Presents login, signup, log capture, filters, audit trail, and semantic search UI
- Sends all API calls only to the gateway

### FastAPI Gateway

- Single entry point for client requests
- Simplifies routing
- Handles frontend hosting
- Can aggregate or transform responses later

### Spring Boot

- Business logic
- JWT authentication
- Role-based access control
- Activity logging, filtering, summary, audit trail, and semantic search APIs
- Validation

### Node.js Backend

- Separate Review 3 backend service
- Provides CRUD APIs for activity records
- Provides audit records for Node.js CRUD actions
- Runs on port `7000`
- Exposed through the FastAPI gateway at `/node-api`

### PostgreSQL

Stores relational tables:

- users
- activity_summary

### MongoDB

Stores document collections:

- activity_logs
- audit_trails
- log_embeddings

## Why API Gateway Is Needed

- Hides internal backend URLs from the client
- Simplifies CORS and security management
- Gives one consistent endpoint to the frontend
- Makes future microservice expansion easier
- Routes Spring Boot APIs through `/api` and Node.js APIs through `/node-api`

## Vector Search Requirement

The backend stores a compact vector for each log in MongoDB `log_embeddings`. It ranks matching logs with cosine similarity for natural-language style search, and `db/mongo_collections.js` includes a MongoDB Atlas vector index definition.
