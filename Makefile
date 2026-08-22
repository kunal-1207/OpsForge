.PHONY: setup test build docker-build dev k8s-dev k8s-prod clean

setup:
	@echo "Setting up development environment..."
	npm install --prefix app/api-service
	npm install --prefix app/worker-service

test:
	@echo "Running tests..."
	npm test --prefix app/api-service
	npm test --prefix app/worker-service

build:
	@echo "Building applications..."
	npm run build --prefix app/api-service --if-present
	npm run build --prefix app/worker-service --if-present

docker-build:
	@echo "Building Docker images..."
	docker compose build

dev:
	@echo "Starting local development environment..."
	docker compose up -d

k8s-dev:
	@echo "Deploying to Kubernetes (Development)..."
	kubectl apply -k kubernetes/overlays/dev

k8s-prod:
	@echo "Deploying to Kubernetes (Production)..."
	kubectl apply -k kubernetes/overlays/prod

clean:
	@echo "Cleaning up..."
	docker compose down -v
