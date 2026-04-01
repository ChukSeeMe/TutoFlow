# TutorFlow — Development Makefile
# Run `make help` to see all commands

.PHONY: help up down build logs shell-api shell-db seed migrate test-backend test-frontend lint-backend lint-frontend reset

##@ General

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker

up: ## Start all services (detached)
	docker compose up -d

down: ## Stop all services
	docker compose down

build: ## Rebuild all images
	docker compose build --no-cache

logs: ## Tail logs from all services
	docker compose logs -f

logs-api: ## Tail backend logs only
	docker compose logs -f backend

logs-web: ## Tail frontend logs only
	docker compose logs -f frontend

restart-api: ## Restart backend only (applies code changes)
	docker compose restart backend

ps: ## Show running containers
	docker compose ps

##@ Database

migrate: ## Run Alembic migrations inside the backend container
	docker exec tutorflow_api alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="add_table_name")
	docker exec tutorflow_api alembic revision --autogenerate -m "$(MSG)"

seed: ## Seed the database with demo data
	docker exec tutorflow_api python scripts/seed.py

db-shell: ## Open a psql shell
	docker exec -it tutorflow_db psql -U tutorflow -d tutorflow_db

db-reset: ## WARNING: Drop and recreate the database (destroys all data)
	docker exec tutorflow_db psql -U tutorflow -c "DROP DATABASE IF EXISTS tutorflow_db;" postgres
	docker exec tutorflow_db psql -U tutorflow -c "CREATE DATABASE tutorflow_db;" postgres
	$(MAKE) migrate
	$(MAKE) seed

##@ Testing

test-backend: ## Run backend tests inside container
	docker exec tutorflow_api pytest tests/ -v

test-backend-local: ## Run backend tests locally (requires local Python env)
	cd backend && pytest tests/ -v

test-frontend: ## Run frontend tests
	docker exec tutorflow_web npx vitest run

test: test-backend test-frontend ## Run all tests

##@ Code Quality

lint-backend: ## Lint and type-check backend
	docker exec tutorflow_api python -m mypy app/ --ignore-missing-imports || true
	docker exec tutorflow_api python -m ruff check app/ || true

lint-frontend: ## Type-check frontend
	docker exec tutorflow_web npx tsc --noEmit

lint: lint-backend lint-frontend ## Lint everything

##@ Development

shell-api: ## Open a bash shell inside the backend container
	docker exec -it tutorflow_api bash

shell-web: ## Open a shell inside the frontend container
	docker exec -it tutorflow_web sh

env-setup: ## Copy .env.example to .env if .env doesn't exist
	@if [ ! -f .env ]; then cp .env.example .env && echo ".env created — fill in secrets before running."; else echo ".env already exists."; fi

reset: down ## Full reset: stop, remove volumes, restart, seed
	docker compose down -v
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 15
	$(MAKE) seed
