# ADR-003: Use Custom Kubernetes Controller for Application Management

## Context
OpsForge needs to translate the high-level `Application` concept (image, replicas, environment) into native Kubernetes resources (Deployments, Services, RBAC, etc.). Initially, this might have been done by rendering Helm charts or applying Kustomize overlays in a CI/CD pipeline. However, an Internal Developer Platform (IDP) benefits from moving this logic into the cluster using the Operator pattern.

## Decision
We will introduce an `Application` Custom Resource Definition (CRD) and build a custom Kubernetes Controller in Go to reconcile this resource into its constituent lower-level resources.

## Alternatives Considered
- **Helm Controller/GitOps Only:** Using ArgoCD or Flux to apply rendered manifests. While we will use GitOps for deploying the CRD instances themselves, the logic of "what an Application looks like" belongs in the controller rather than scattered across many Helm templates.
- **Python-based Operator (Kopf):** Go is the native language of Kubernetes and we are standardizing on Go for the control plane.
- **Kubebuilder:** We opted to manually scaffold the `controller-runtime` logic as `kubebuilder` is not strictly necessary and doing it manually provides a clearer understanding of the underlying moving parts for educational purposes.

## Consequences
- **Positive:** True declarative state inside the cluster. The Go API only needs to create an `Application` CR in the cluster, and the controller handles the rest. This decouples the API from Kubernetes deployment specifics.
- **Negative:** Adds complexity with writing and maintaining a reconciliation loop and ensuring idempotency.
