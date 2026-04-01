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

echo "► Getting ACR credentials..."
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer --output tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" --output tsv)

echo "► Logging in to ACR..."
echo "$ACR_PASSWORD" | docker login "$ACR_LOGIN_SERVER" --username "$ACR_NAME" --password-stdin

echo "► Building & pushing backend..."
docker build --platform linux/amd64 -t "$ACR_LOGIN_SERVER/tutorflow-backend:latest" ./backend
docker push "$ACR_LOGIN_SERVER/tutorflow-backend:latest"

echo "► Building & pushing frontend..."
docker build --platform linux/amd64 -t "$ACR_LOGIN_SERVER/tutorflow-frontend:latest" ./frontend
docker push "$ACR_LOGIN_SERVER/tutorflow-frontend:latest"

echo "► Updating Container Apps..."
az containerapp update --resource-group "$RESOURCE_GROUP" --name "$APP_NAME_BACKEND" \
  --image "$ACR_LOGIN_SERVER/tutorflow-backend:latest" --output table

az containerapp update --resource-group "$RESOURCE_GROUP" --name "$APP_NAME_FRONTEND" \
  --image "$ACR_LOGIN_SERVER/tutorflow-frontend:latest" --output table

echo ""
echo "✓ Redeploy complete. New containers are rolling out."
