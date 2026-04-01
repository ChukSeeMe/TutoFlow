#!/usr/bin/env bash
# =============================================================================
# TutorFlow — Azure Deployment Script
# =============================================================================
# Prerequisites:
#   1. Azure CLI installed: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows
#   2. Docker Desktop running
#   3. Run: az login
#   4. Set the variables in the CONFIGURATION section below
#
# Usage:
#   bash deploy-azure.sh
# =============================================================================

set -euo pipefail

# ── CONFIGURATION — edit these before running ─────────────────────────────────
RESOURCE_GROUP="tutorflow-rg"
LOCATION="uksouth"                        # Azure region (uksouth = London)
ACR_NAME="tutorflowacr"                   # Must be globally unique, lowercase, 5-50 chars
ENVIRONMENT_NAME="tutorflow-env"          # Container Apps environment name
APP_NAME_BACKEND="tutorflow-backend"
APP_NAME_FRONTEND="tutorflow-frontend"
POSTGRES_SERVER="tutorflow-db"            # Must be globally unique
POSTGRES_USER="tutorflow"
POSTGRES_DB="tutorflow_db"

# ── Read secrets from .env ────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.example to .env and fill in values."
  exit 1
fi

export $(grep -v '^#' .env | grep -v '^$' | xargs)

# Validate required secrets
REQUIRED_VARS=(POSTGRES_PASSWORD SECRET_KEY ANTHROPIC_API_KEY NEXTAUTH_SECRET)
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ] || [[ "${!var}" == *"change_me"* ]] || [[ "${!var}" == *"your-key"* ]] || [[ "${!var}" == *"generate"* ]]; then
    echo "ERROR: $var is not set or still has a placeholder value in .env"
    exit 1
  fi
done

echo ""
echo "=========================================="
echo "  TutorFlow — Azure Deployment"
echo "  Region: $LOCATION"
echo "  Resource Group: $RESOURCE_GROUP"
echo "=========================================="
echo ""

# ── Step 1: Ensure logged in ──────────────────────────────────────────────────
echo "► Checking Azure login..."
az account show --output table || { echo "Not logged in. Run: az login"; exit 1; }

# ── Step 2: Create resource group ─────────────────────────────────────────────
echo ""
echo "► Creating resource group: $RESOURCE_GROUP..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output table

# ── Step 3: Create Azure Container Registry ───────────────────────────────────
echo ""
echo "► Creating Azure Container Registry: $ACR_NAME..."
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true \
  --output table

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer --output tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" --output tsv)

echo "  ACR Login Server: $ACR_LOGIN_SERVER"

# ── Step 4: Build & push Docker images ────────────────────────────────────────
echo ""
echo "► Logging in to ACR..."
echo "$ACR_PASSWORD" | docker login "$ACR_LOGIN_SERVER" --username "$ACR_NAME" --password-stdin

echo ""
echo "► Building backend image..."
docker build \
  --platform linux/amd64 \
  -t "$ACR_LOGIN_SERVER/tutorflow-backend:latest" \
  ./backend

echo ""
echo "► Building frontend image..."
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=/api/backend \
  -t "$ACR_LOGIN_SERVER/tutorflow-frontend:latest" \
  ./frontend

echo ""
echo "► Pushing images to ACR..."
docker push "$ACR_LOGIN_SERVER/tutorflow-backend:latest"
docker push "$ACR_LOGIN_SERVER/tutorflow-frontend:latest"

# ── Step 5: Create PostgreSQL Flexible Server ─────────────────────────────────
echo ""
echo "► Creating PostgreSQL Flexible Server: $POSTGRES_SERVER..."
az postgres flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --location "$LOCATION" \
  --admin-user "$POSTGRES_USER" \
  --admin-password "$POSTGRES_PASSWORD" \
  --database-name "$POSTGRES_DB" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --public-access 0.0.0.0 \
  --output table

POSTGRES_HOST="${POSTGRES_SERVER}.postgres.database.azure.com"
DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?ssl=require"

echo "  PostgreSQL host: $POSTGRES_HOST"

# ── Step 6: Create Azure Files share for reports ──────────────────────────────
echo ""
echo "► Creating storage account for reports..."
STORAGE_ACCOUNT="tutorflowstorage$(date +%s | tail -c 6)"
az storage account create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$STORAGE_ACCOUNT" \
  --sku Standard_LRS \
  --output table

STORAGE_KEY=$(az storage account keys list \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "$STORAGE_ACCOUNT" \
  --query "[0].value" --output tsv)

az storage share create \
  --name "reports" \
  --account-name "$STORAGE_ACCOUNT" \
  --account-key "$STORAGE_KEY" \
  --output table

# ── Step 7: Create Container Apps Environment ─────────────────────────────────
echo ""
echo "► Creating Container Apps Environment: $ENVIRONMENT_NAME..."
az containerapp env create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ENVIRONMENT_NAME" \
  --location "$LOCATION" \
  --output table

# Mount Azure Files in the environment
az containerapp env storage set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ENVIRONMENT_NAME" \
  --storage-name "reports-storage" \
  --azure-file-account-name "$STORAGE_ACCOUNT" \
  --azure-file-account-key "$STORAGE_KEY" \
  --azure-file-share-name "reports" \
  --access-mode ReadWrite \
  --output table

# ── Step 8: Deploy backend ────────────────────────────────────────────────────
echo ""
echo "► Deploying backend Container App..."
az containerapp create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME_BACKEND" \
  --environment "$ENVIRONMENT_NAME" \
  --image "$ACR_LOGIN_SERVER/tutorflow-backend:latest" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 8000 \
  --ingress internal \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    "DATABASE_URL=$DATABASE_URL" \
    "SECRET_KEY=$SECRET_KEY" \
    "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" \
    "UNSPLASH_ACCESS_KEY=${UNSPLASH_ACCESS_KEY:-}" \
    "ENVIRONMENT=production" \
    "LOG_LEVEL=INFO" \
    "ALGORITHM=HS256" \
    "ACCESS_TOKEN_EXPIRE_MINUTES=30" \
    "REFRESH_TOKEN_EXPIRE_DAYS=7" \
    "AI_MODEL=${AI_MODEL:-claude-opus-4-6}" \
    "AI_MAX_TOKENS=${AI_MAX_TOKENS:-4096}" \
    "REPORTS_DIR=/app/reports" \
    "SMTP_HOST=${SMTP_HOST:-}" \
    "SMTP_PORT=${SMTP_PORT:-587}" \
    "SMTP_USERNAME=${SMTP_USERNAME:-}" \
    "SMTP_PASSWORD=${SMTP_PASSWORD:-}" \
    "SMTP_FROM_NAME=${SMTP_FROM_NAME:-TutorFlow}" \
    "SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL:-noreply@tutorflow.co.uk}" \
  --output table

# Get backend internal FQDN
BACKEND_FQDN=$(az containerapp show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME_BACKEND" \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv)
BACKEND_INTERNAL_URL="http://${APP_NAME_BACKEND}"

echo "  Backend internal URL: $BACKEND_INTERNAL_URL"

# ── Step 9: Run database migrations ───────────────────────────────────────────
echo ""
echo "► Running database migrations..."
az containerapp job create \
  --resource-group "$RESOURCE_GROUP" \
  --name "tutorflow-migrate" \
  --environment "$ENVIRONMENT_NAME" \
  --image "$ACR_LOGIN_SERVER/tutorflow-backend:latest" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --replica-timeout 300 \
  --replica-retry-limit 1 \
  --trigger-type Manual \
  --parallelism 1 \
  --replica-completion-count 1 \
  --env-vars "DATABASE_URL=$DATABASE_URL" \
  --command "alembic" "upgrade" "head" \
  --output table

az containerapp job start \
  --resource-group "$RESOURCE_GROUP" \
  --name "tutorflow-migrate" \
  --output table

echo "  Waiting for migrations to complete..."
sleep 30

# ── Step 10: Deploy frontend ──────────────────────────────────────────────────
echo ""
echo "► Deploying frontend Container App..."

az containerapp create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME_FRONTEND" \
  --environment "$ENVIRONMENT_NAME" \
  --image "$ACR_LOGIN_SERVER/tutorflow-frontend:latest" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    "NODE_ENV=production" \
    "NEXT_PUBLIC_API_URL=/api/backend" \
    "BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL:8000" \
    "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" \
    "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}" \
    "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}" \
    "AZURE_AD_CLIENT_ID=${AZURE_AD_CLIENT_ID:-}" \
    "AZURE_AD_CLIENT_SECRET=${AZURE_AD_CLIENT_SECRET:-}" \
    "AZURE_AD_TENANT_ID=${AZURE_AD_TENANT_ID:-common}" \
  --output table

# Get public URL
FRONTEND_URL=$(az containerapp show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME_FRONTEND" \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv)

FRONTEND_HTTPS="https://${FRONTEND_URL}"

# ── Step 11: Update CORS and NextAuth URL with real domain ────────────────────
echo ""
echo "► Updating CORS and NextAuth URL with live domain..."

az containerapp update \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME_BACKEND" \
  --set-env-vars "BACKEND_CORS_ORIGINS=$FRONTEND_HTTPS" "APP_BASE_URL=$FRONTEND_HTTPS" \
  --output table

az containerapp update \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME_FRONTEND" \
  --set-env-vars "NEXTAUTH_URL=$FRONTEND_HTTPS" \
  --output table

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "  App URL:      $FRONTEND_HTTPS"
echo "  Backend:      internal only (${APP_NAME_BACKEND})"
echo "  Database:     $POSTGRES_HOST"
echo "  ACR:          $ACR_LOGIN_SERVER"
echo ""
echo "  Next steps:"
echo "  1. Update your OAuth redirect URIs to: $FRONTEND_HTTPS"
echo "     Google:    $FRONTEND_HTTPS/api/auth/callback/google"
echo "     Microsoft: $FRONTEND_HTTPS/api/auth/callback/azure-ad"
echo "  2. Seed initial data:"
echo "     az containerapp exec --name $APP_NAME_BACKEND --resource-group $RESOURCE_GROUP --command 'python scripts/seed.py'"
echo ""
