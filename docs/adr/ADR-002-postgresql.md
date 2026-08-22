# ADR-002: Use PostgreSQL as the Control Plane Datastore

## Context
OpsForge 2.0 requires a persistent datastore for the control plane to manage applications, environments, deployment history, incidents, and audit events. The data model is inherently relational.

## Decision
We will use **PostgreSQL** as the primary datastore for the OpsForge Go API.

## Alternatives Considered
- **Redis:** Used currently for queues and temporary caching in the worker service. Not suitable for complex relational querying or long-term persistence of structured deployment history.
- **MongoDB:** While flexible, our entities (Applications, Environments, Deployments) have well-defined structures and relationships. A NoSQL database would force us to handle referential integrity in the application layer.

## Consequences
- **Positive:** ACID compliance, strong typing, structured schema migrations, and native Go support (`pgx`).
- **Negative:** Adds a new stateful component to the platform infrastructure, requiring backup/restore strategies and volume management.
