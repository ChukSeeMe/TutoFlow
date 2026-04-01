#!/usr/bin/env bash
# =============================================================================
# TutorFlow — Quick Redeploy (trigger GitHub Actions)
# This script does NOT build images — it triggers the GitHub Actions workflow
# which builds on GitHub runners and deploys to Azure Container Apps.
# =============================================================================
echo ""
echo "To redeploy TutorFlow, trigger the GitHub Actions workflow:"
echo ""
echo "  https://github.com/ChukSeeMe/TutoFlow/actions/workflows/deploy.yml"
echo ""
echo "Click 'Run workflow' → 'Run workflow' (green button)."
echo ""
echo "Or push any commit to main — the workflow triggers automatically."
echo ""
