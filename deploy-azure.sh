#!/usr/bin/env bash
# =============================================================================
# TutorFlow — Azure Infrastructure Setup
# This script creates all Azure resources only (no Docker/image building).
# Images are built and deployed via GitHub Actions (.github/workflows/deploy.yml)
# =============================================================================

set -euo pipefail

RESOURCE_GROUP="tutorflow-rg"
LOCATION="uksouth"
ACR_NAME="tutorflowacr"
ENVIRONMENT_NAME="tutorflow-env"
APP_NAME_BACKEND="tutorflow-backend"
APP_NAME_FRONTEND="tutorflow-frontend"
POSTGRES_SERVER="tutorflow-db"
POSTGRES_USER="tutorflow"
POSTGRES_DB="tutorflow_db"

# ── Read .env ─────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "ERROR: .env file not found."
  exit 1
fi

set -a
source .env
set +a

# Validate required secrets
for var in POSTGRES_PASSWORD SECRET_KEY ANTHROPIC_API_KEY NEXTAUTH_SECRET; do
  val="${!var:-}"
  if [ -z "$val" ] || [[ "$val" == *"change_me"* ]] || [[ "$val" == *"your-key"* ]] || [[ "$val" == *"generate"* ]]; then
    echo "ERROR: $var is not set or still has a placeholder value in .env"
    exit 1
  fi
done

echo ""
echo "=========================================="
echo "  TutorFlow — Azure Infrastructure Setup"
echo "  Region: $LOCATION"
echo "=========================================="
echo ""

# ── Step 1: Login check ───────────────────────────────────────────────────────
echo "► Checking Azure login..."
az account show --output table || { echo "Run: az login"; exit 1; }

# ── Step 2: Resource group ────────────────────────────────────────────────────
echo ""
echo "► Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table

# ── Step 3: Container Registry ───────────────────────────────────────────────
# NOTE: az acr create triggers ACR Tasks internally which is blocked on this subscription.
# If the registry already exists we skip creation and just read its credentials.
echo ""
echo "► Checking Azure Container Registry..."
if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  echo "  ACR already exists — skipping creation."
else
  echo "  Registry not found. Creating (no Tasks used)..."
  az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true \
    --output table
fi

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer --output tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" --output tsv)
echo "  ACR: $ACR_LOGIN_SERVER"

# ── Step 4: PostgreSQL ────────────────────────────────────────────────────────
echo ""
echo "► Creating PostgreSQL Flexible Server (takes ~3 mins)..."
if az postgres flexible-server show --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_SERVER" &>/dev/null; then
  echo "  PostgreSQL server already exists — skipping creation."
else
az postgres flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --location "$LOCATION" \
  --admin-user "$POSTGRES_USER" \
  --admin-password "$POSTGRES_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --public-access 0.0.0.0 \
  --output table

az postgres flexible-server db create \
  --resource-group "$RESOURCE_GROUP" \
  --server-name "$POSTGRES_SERVER" \
  --database-name "$POSTGRES_DB" \
  --output table
fi

POSTGRES_HOST="${POSTGRES_SERVER}.postgres.database.azure.com"
DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?ssl=require"
echo "  DB host: $POSTGRES_HOST"

# ── Step 5: Storage for reports ───────────────────────────────────────────────
echo ""
echo "► Checking storage account..."
EXISTING_STORAGE=$(az storage account list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[0].name" --output tsv 2>/dev/null || true)

if [ -n "$EXISTING_STORAGE" ]; then
  echo "  Storage account already exists: $EXISTING_STORAGE — reusing."
  STORAGE_ACCOUNT="$EXISTING_STORAGE"
else
  STORAGE_ACCOUNT="tutorflowfiles$(shuf -i 10000-99999 -n 1)"
  echo "  Creating storage account $STORAGE_ACCOUNT..."
  az storage account create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$STORAGE_ACCOUNT" \
    --sku Standard_LRS \
    --output table
fi

STORAGE_KEY=$(az storage account keys list \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "$STORAGE_ACCOUNT" \
  --query "[0].value" --output tsv)

az storage share create \
  --name "reports" \
  --account-name "$STORAGE_ACCOUNT" \
  --account-key "$STORAGE_KEY" \
  --output table 2>/dev/null || echo "  File share already exists — skipping."

# ── Step 6: Container Apps Environment ───────────────────────────────────────
echo ""
echo "► Checking Container Apps Environment..."
if az containerapp env show --resource-group "$RESOURCE_GROUP" --name "$ENVIRONMENT_NAME" &>/dev/null; then
  echo "  Environment already exists — skipping creation."
else
  echo "  Creating Container Apps Environment..."
  az containerapp env create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ENVIRONMENT_NAME" \
    --location "$LOCATION" \
    --output table
fi

if az containerapp env storage show --resource-group "$RESOURCE_GROUP" --name "$ENVIRONMENT_NAME" --storage-name "reports-storage" &>/dev/null; then
  echo "  Storage mount already exists — skipping."
else
  az containerapp env storage set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ENVIRONMENT_NAME" \
    --storage-name "reports-storage" \
    --azure-file-account-name "$STORAGE_ACCOUNT" \
    --azure-file-account-key "$STORAGE_KEY" \
    --azure-file-share-name "reports" \
    --access-mode ReadWrite \
    --output table
fi

# ── GitHub repo owner (for ghcr.io image names) ──────────────────────────────
GITHUB_OWNER="chukseeme"   # lowercase — ghcr.io requires lowercase
IMAGE_BACKEND="ghcr.io/${GITHUB_OWNER}/tutorflow-backend:latest"
IMAGE_FRONTEND="ghcr.io/${GITHUB_OWNER}/tutorflow-frontend:latest"

# ── Step 7: Deploy backend Container App (placeholder image) ─────────────────
echo ""
if az containerapp show --resource-group "$RESOURCE_GROUP" --name "$APP_NAME_BACKEND" &>/dev/null; then
  echo "► Backend Container App already exists — skipping creation."
else
  echo "► Creating backend Container App..."
  az containerapp create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME_BACKEND" \
    --environment "$ENVIRONMENT_NAME" \
    --image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" \
    --target-port 80 \
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
fi

# ── Step 8: Deploy frontend Container App (placeholder image) ─────────────────
echo ""
if az containerapp show --resource-group "$RESOURCE_GROUP" --name "$APP_NAME_FRONTEND" &>/dev/null; then
  echo "► Frontend Container App already exists — skipping creation."
else
  echo "► Creating frontend Container App..."
  az containerapp create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME_FRONTEND" \
    --environment "$ENVIRONMENT_NAME" \
    --image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" \
    --target-port 80 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1.0Gi \
    --env-vars \
      "NODE_ENV=production" \
      "NEXT_PUBLIC_API_URL=/api/backend" \
      "BACKEND_INTERNAL_URL=http://${APP_NAME_BACKEND}:8000" \
      "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" \
      "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}" \
      "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}" \
      "AZURE_AD_CLIENT_ID=${AZURE_AD_CLIENT_ID:-}" \
      "AZURE_AD_CLIENT_SECRET=${AZURE_AD_CLIENT_SECRET:-}" \
      "AZURE_AD_TENANT_ID=${AZURE_AD_TENANT_ID:-common}" \
    --output table
fi

# ── Get live URL and update CORS ──────────────────────────────────────────────
FRONTEND_URL=$(az containerapp show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME_FRONTEND" \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv)
FRONTEND_HTTPS="https://${FRONTEND_URL}"

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

# ── Print GitHub Actions secrets needed ───────────────────────────────────────
echo ""
echo "=========================================="
echo "  Infrastructure ready!"
echo "=========================================="
echo ""
echo "  App URL (placeholder):  $FRONTEND_HTTPS"
echo "  DB Host:                $POSTGRES_HOST"
echo ""
echo "  !! NEXT STEP: Add these to GitHub Secrets !!"
echo "  Go to: https://github.com/ChukSeeMe/TutoFlow/settings/secrets/actions"
echo ""
echo "  AZURE_CREDENTIALS  => run: az ad sp create-for-rbac --name tutorflow-deploy --role contributor --scopes /subscriptions/\$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP --sdk-auth"
echo "  GHCR_TOKEN         => a GitHub Personal Access Token with 'write:packages' scope"
echo "                        Create at: https://github.com/settings/tokens/new"
echo ""
echo "  Images will be pushed to ghcr.io (GitHub Container Registry) — no ACR Tasks needed."
echo "  Then go to GitHub Actions and run 'Deploy to Azure' workflow."
echo ""
