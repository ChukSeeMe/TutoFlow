#!/usr/bin/env bash
# =============================================================================
# TutorFlow — Quick Redeploy to Azure (update images only)
# Run this after code changes to push new builds without recreating infrastructure
# =============================================================================
set -euo pipefail

RESOURCE_GROUP="tutorflow-rg"
ACR_NAME="tutorflowacr"
APP_NAME_BACKEND="tutorflow-backend"
APP_NAME_FRONTEND="tutorflow-frontend"

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer --output tsv)

echo "► Building backend in Azure ACR..."
az acr build \
  --registry "$ACR_NAME" \
  --image "tutorflow-backend:latest" \
  --platform linux/amd64 \
  ./backend

echo "► Building frontend in Azure ACR..."
az acr build \
  --registry "$ACR_NAME" \
  --image "tutorflow-frontend:latest" \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=/api/backend \
  ./frontend

echo "► Updating Container Apps..."
az containerapp update --resource-group "$RESOURCE_GROUP" --name "$APP_NAME_BACKEND" \
  --image "$ACR_LOGIN_SERVER/tutorflow-backend:latest" --output table

az containerapp update --resource-group "$RESOURCE_GROUP" --name "$APP_NAME_FRONTEND" \
  --image "$ACR_LOGIN_SERVER/tutorflow-frontend:latest" --output table

echo ""
echo "✓ Redeploy complete. New containers are rolling out."
