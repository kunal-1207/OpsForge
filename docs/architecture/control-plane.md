# Control Plane Architecture

The OpsForge control plane is responsible for managing the lifecycle of applications running on the platform. It abstracts away the raw Kubernetes primitives, providing a simplified interface for developers.

## Components

1. **OpsForge Portal (TypeScript/React)**
   - Developer-facing UI for viewing and managing applications.
   - Communicates exclusively with the OpsForge API.

2. **OpsForge CLI (Go)**
   - Developer-facing command-line tool.
   - Communicates exclusively with the OpsForge API.

3. **OpsForge API (Go)**
   - Central control plane API.
   - Maintains state in PostgreSQL (Application metadata, Deployment history, Audit events).
   - Translates developer intents into Kubernetes Custom Resources (CRs).

4. **PostgreSQL**
   - Source of truth for the platform metadata.

5. **OpsForge Controller (Go / Kubernetes Operator)**
   - Runs inside the Kubernetes cluster.
   - Watches `Application` Custom Resources.
   - Reconciles the desired state by creating/updating lower-level Kubernetes resources (Deployments, Services, RBAC).
   - Reports status back to the API/CR status fields.

## Workflow

```text
[Developer] -> [Portal / CLI] -> [OpsForge API] -> (Saves metadata to Postgres) -> [Creates Application CR in K8s]
                                                                                            |
                                                                                            v
                                                                             [OpsForge Controller]
                                                                                            |
                                                                                            +-> [Creates Deployment]
                                                                                            +-> [Creates Service]
                                                                                            +-> [Configures Autoscaling]
```
