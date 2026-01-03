# OpsForge

A comprehensive, production-ready DevOps platform demonstrating end-to-end ownership of code delivery, infrastructure, reliability, observability, and failure recovery. This system represents how a real startup or mid-size tech company would deploy and operate services in production.

## 🎯 Objective

Build a complete platform consisting of:
- Real containerized microservices
- CI/CD pipelines
- Kubernetes-based production deployment
- Full observability (metrics, logs, alerts)
- Failure handling and rollback mechanisms
- Clear operational documentation

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Service   │    │  Worker Service │    │     Redis       │
│   (REST API)    │    │  (Background   │    │   (Queue)       │
│                 │    │    Jobs)        │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────────────┘
          │                      │
          │                      │
          ▼                      ▼
    ┌─────────────┐      ┌───────────────┐
    │  Kubernetes │      │ Observability │
    │  Cluster    │      │  Stack        │
    │             │      │ (Prometheus,  │
    │ • Deployments     │  Grafana,     │
    │ • Services        │  Loki,        │
    │ • Ingress         │  Alertmanager)│
    └─────────────┘      └───────────────┘
```

### Services

#### API Service
- **Technology**: Node.js/Express
- **Function**: REST API for handling client requests
- **Endpoints**:
  - `/health` - Health check
  - `/ready` - Readiness check
  - `/metrics` - Prometheus metrics
  - `/api/status` - API status
  - `/api/job` - Create background job

#### Worker Service
- **Technology**: Node.js/Bull Queue
- **Function**: Background job processing
- **Features**:
  - Job queue with Redis
  - Retry logic with exponential backoff
  - Job processing metrics

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Kubernetes cluster (for production deployment)

### Local Development

1. Clone the repository
2. Navigate to project directory
3. Start services with Docker Compose:
```bash
docker-compose up --build
```

4. Access services:
   - API Service: http://localhost:3000
   - Worker Service: http://localhost:3001
   - Redis Commander: http://localhost:8081

## 🏗️ Kubernetes Deployment

### Environment Setup

The platform supports multiple environments:

#### Development
- Namespace: `dev`
- Replicas: 1 for each service
- Resources: Lower limits for development

#### Production
- Namespace: `prod`
- Replicas: 3 for each service
- Resources: Higher limits for production

### Deploy to Kubernetes

```bash
# Deploy to development
kubectl kustomize k8s/overlays/dev | kubectl apply -f -

# Deploy to production
kubectl kustomize k8s/overlays/prod | kubectl apply -f -
```

## 🔄 CI/CD Pipeline

The CI/CD pipeline is implemented using GitHub Actions with the following stages:

### Pipeline Stages
1. **Test**: Unit tests and linting
2. **Security Scan**: Vulnerability scanning
3. **Build & Push**: Build Docker images and push to registry
4. **Deploy**: Deploy to development/production

### Deployment Strategy
- **Development**: Direct deployment after successful build
- **Production**: Manual approval required before deployment
- **Rolling Updates**: Zero-downtime deployments with rolling updates
- **Auto-scaling**: HPA configured for automatic scaling based on CPU/memory

## 📊 Observability Stack

### Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and notification
- **Loki**: Centralized logging

### Metrics Collection
- Custom business metrics
- RED metrics (Rate, Errors, Duration)
- Resource utilization
- Application-specific metrics

### Logging
- Structured JSON logs
- Correlation IDs for request tracing
- Centralized log aggregation with Loki

## 🚨 Alerting & Monitoring

### Alert Categories
1. **Service Health**: Service availability, error rates
2. **Performance**: Latency, resource usage
3. **Infrastructure**: Node health, pod status
4. **Business**: Job processing, queue size

### Alert Routing
- API service alerts → API team
- Worker service alerts → Worker team
- Critical alerts → SRE team
- Inhibition rules to prevent alert storms

## 🛡️ Reliability & Failure Scenarios

### Implemented Scenarios
1. **Application Crash**: Detection, auto-restart, alerting
2. **Pod Eviction/Node Failure**: Auto-rescheduling, capacity maintenance
3. **Bad Deployment**: Error detection, manual rollback procedure

### Resilience Features
- **Health Checks**: Liveness and readiness probes
- **Resource Limits**: CPU and memory constraints
- **Pod Disruption Budgets**: Minimum availability guarantees
- **Horizontal Pod Autoscaling**: Automatic scaling based on metrics
- **Graceful Shutdown**: Proper service termination

## 📁 Project Structure

```
OpsForge/
├── app/                    # Application code
│   ├── api-service/        # API service
│   └── worker-service/     # Worker service
├── cicd/                   # CI/CD configurations
│   └── github-actions/     # GitHub Actions workflows
├── k8s/                    # Kubernetes manifests
│   ├── manifests/          # Base manifests
│   ├── overlays/
│   │   ├── dev/           # Development overlay
│   │   └── prod/          # Production overlay
├── observability/          # Monitoring stack
│   ├── prometheus/         # Prometheus config
│   ├── grafana/            # Grafana dashboards
│   ├── loki/              # Loki config
│   └── alertmanager/      # Alertmanager config
├── docs/                   # Documentation
└── docker-compose.yml      # Local development
```

## 🛠️ Technologies Used

### Application Layer
- **Node.js**: Runtime environment
- **Express**: Web framework
- **Bull**: Job queue processing
- **Redis**: Queue and caching

### Containerization
- **Docker**: Containerization
- **Multi-stage builds**: Optimized images
- **Non-root containers**: Security best practices

### Infrastructure
- **Kubernetes**: Container orchestration
- **Kustomize**: Configuration management
- **Helm**: Package management (optional)

### CI/CD
- **GitHub Actions**: Pipeline orchestration
- **Docker Registry**: Image storage
- **Trivy**: Security scanning

### Observability
- **Prometheus**: Metrics
- **Grafana**: Dashboards
- **Loki**: Logging
- **Alertmanager**: Alerting

## 📊 SRE Principles Implemented

### Four Golden Signals
1. **Latency**: Request duration metrics
2. **Traffic**: Request rate metrics
3. **Errors**: Error rate metrics
4. **Saturation**: Resource utilization

### Reliability Practices
- **Error Budget**: Defined error budget for service level objectives
- **SLOs**: Service level objectives with burn rate alerts
- **Chaos Engineering**: Planned failure testing
- **Incident Response**: Structured incident response process

## 🔧 Operational Procedures

### Deployment Process
1. Code changes trigger CI/CD pipeline
2. Automated testing and security scanning
3. Docker image building and pushing
4. Kubernetes deployment with rolling updates
5. Health check validation
6. Traffic routing

### Incident Response
1. Alert detection and notification
2. Triage and impact assessment
3. Remediation (automated or manual)
4. Recovery verification
5. Post-incident analysis

## 🎯 Quality Bar

This project demonstrates:
- **Production thinking**: Design for failure, resilience patterns
- **Failure-first design**: Plan for what can go wrong
- **Clear operational ownership**: Defined responsibilities
- **Strong DevOps and SRE fundamentals**: Industry best practices

### What This System Would Scale To
- **Horizontal Scaling**: Additional nodes and services
- **Geographic Distribution**: Multi-region deployments
- **Advanced Monitoring**: Custom business metrics
- **Enhanced Security**: Network policies, service mesh
- **Chaos Engineering**: Automated failure testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with comprehensive tests
4. Submit a pull request with detailed description
5. Address review comments
6. Merge after approval

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*"This system is designed as if you are the only DevOps engineer responsible for keeping this service alive in production."*