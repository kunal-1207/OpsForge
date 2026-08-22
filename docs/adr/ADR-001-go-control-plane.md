# ADR-001: Use Go for the Control Plane API

## Context
OpsForge requires a central API to handle application registration, environment management, deployments, and integration with Kubernetes resources. This control-plane API needs to be high-performance, strongly typed, and have excellent integration with Kubernetes native tooling (such as the Kubernetes Go client).

## Decision
We will use **Go** as the primary language for the OpsForge control-plane API and related platform engineering tools (Kubernetes controller, CLI).

## Alternatives Considered
- **Node.js/TypeScript:** We already have Node.js in the application layer. However, Go provides superior performance, a more robust standard library for concurrency, and is the industry standard language for Kubernetes operators and platform tools.
- **Python:** Good for scripting but lacks the static typing safety and raw performance for a high-throughput control plane. 

## Consequences
- **Positive:** We align with cloud-native ecosystem standards. We can reuse Go structures across the API, Controller, and CLI. Native Kubernetes client support.
- **Negative:** The team must maintain polyglot environments (Node.js for apps, Go for platform).
