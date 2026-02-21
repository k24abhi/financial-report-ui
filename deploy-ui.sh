#!/usr/bin/env bash
# =============================================================================
# deploy-ui.sh  —  Build & deploy financial-report-ui to S3 + CloudFront
#
# Usage:
#   ./deploy-ui.sh [--env staging|production]
#
# Required environment variables (or .env.deploy file):
#   VITE_AUTH0_DOMAIN        Auth0 domain
#   VITE_AUTH0_CLIENT_ID     Auth0 SPA client ID
#   VITE_AUTH0_AUDIENCE      Auth0 API audience
#   VITE_API_URL             Backend API URL
#   UI_S3_BUCKET             S3 bucket name for the UI (e.g. financial-report-ui-prod)
#   CLOUDFRONT_DISTRIBUTION  CloudFront distribution ID
#   AWS_REGION               AWS region (default: us-east-1)
# =============================================================================

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
DEPLOY_ENV="production"
AWS_REGION="${AWS_REGION:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      DEPLOY_ENV="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 [--env staging|production]"
      exit 1
      ;;
  esac
done

# ── Load .env.deploy if present ───────────────────────────────────────────────
if [[ -f "$SCRIPT_DIR/.env.deploy" ]]; then
  echo "📄 Loading .env.deploy..."
  # shellcheck disable=SC1091
  set -a
  source "$SCRIPT_DIR/.env.deploy"
  set +a
fi

# ── Validate required variables ───────────────────────────────────────────────
REQUIRED_VARS=(
  VITE_AUTH0_DOMAIN
  VITE_AUTH0_CLIENT_ID
  VITE_AUTH0_AUDIENCE
  VITE_API_URL
  UI_S3_BUCKET
  CLOUDFRONT_DISTRIBUTION
)
MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    MISSING+=("$var")
  fi
done
if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "❌ Missing required environment variables:"
  for v in "${MISSING[@]}"; do echo "   $v"; done
  exit 1
fi

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo "============================================="
echo "  Financial Report UI — Deploy"
echo "  Environment : $DEPLOY_ENV"
echo "  S3 Bucket   : $UI_S3_BUCKET"
echo "  CloudFront  : $CLOUDFRONT_DISTRIBUTION"
echo "  Region      : $AWS_REGION"
echo "============================================="
echo ""

# ── Install dependencies ──────────────────────────────────────────────────────
echo "📦 Installing npm dependencies..."
cd "$SCRIPT_DIR"
npm ci --prefer-offline

# ── Build ─────────────────────────────────────────────────────────────────────
echo ""
echo "🔨 Building for $DEPLOY_ENV..."
export VITE_AUTH0_DOMAIN
export VITE_AUTH0_CLIENT_ID
export VITE_AUTH0_AUDIENCE
export VITE_API_URL

npm run build
echo "✅ Build complete → dist/"

# ── Security check: ensure no .env files in dist ─────────────────────────────
if find dist -name "*.env" -o -name ".env*" 2>/dev/null | grep -q .; then
  echo "❌ SECURITY: .env file found in dist/ — aborting deployment"
  exit 1
fi

# ── Sync to S3 ────────────────────────────────────────────────────────────────
echo ""
echo "☁️  Uploading to S3 ($UI_S3_BUCKET)..."

# 1. Long-lived cache for fingerprinted assets (JS/CSS have content hashes)
aws s3 sync dist/assets/ "s3://$UI_S3_BUCKET/assets/" \
  --region "$AWS_REGION" \
  --cache-control "public, max-age=31536000, immutable" \
  --delete

# 2. Short-lived cache for HTML (always re-validate)
aws s3 sync dist/ "s3://$UI_S3_BUCKET/" \
  --region "$AWS_REGION" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "assets/*" \
  --delete

echo "✅ S3 sync complete"

# ── Invalidate CloudFront ─────────────────────────────────────────────────────
echo ""
echo "🔄 Invalidating CloudFront distribution ($CLOUDFRONT_DISTRIBUTION)..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text)

echo "   Invalidation ID: $INVALIDATION_ID"

# Wait for invalidation to complete (optional; remove --wait to skip)
echo "   Waiting for invalidation to complete (this may take ~30s)..."
aws cloudfront wait invalidation-completed \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION" \
  --id "$INVALIDATION_ID"

echo "✅ CloudFront cache cleared"

# ── Smoke test ────────────────────────────────────────────────────────────────
if [[ -n "${CLOUDFRONT_DOMAIN:-}" ]]; then
  echo ""
  echo "🔍 Smoke testing https://$CLOUDFRONT_DOMAIN/ ..."
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$CLOUDFRONT_DOMAIN/")
  if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ Smoke test passed (HTTP $HTTP_STATUS)"
  else
    echo "⚠️  Smoke test returned HTTP $HTTP_STATUS (may still be propagating)"
  fi
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "============================================="
echo "  ✅ Deployment complete!"
echo "  Environment : $DEPLOY_ENV"
echo "  Deployed to : s3://$UI_S3_BUCKET"
echo "============================================="
