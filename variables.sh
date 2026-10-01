#!/usr/bin/bash
PROJECT="test-project"
REGION="asia-south2"
SERVICE="client-ledger-frontend"
ARTIFACT_REPO="docker-release"
REPO=${REGION}"-docker.pkg.dev/${PROJECT}/${ARTIFACT_REPO}/${SERVICE}"
VERSION="test"
IMAGE="${REPO}:${VERSION}"

# The backend Cloud Run service. nginx in the frontend image proxies /psc to it, so the
# browser only ever talks to the frontend's own origin (the backend sends no CORS headers).
BACKEND_SERVICE="client-ledger-backend"

# Sets API_UPSTREAM to the backend's URL: an API_UPSTREAM already in the environment wins,
# otherwise it is looked up from BACKEND_SERVICE in the same project and region.
resolve_api_upstream() {
  if [ -z "${API_UPSTREAM:-}" ]; then
    API_UPSTREAM=$(gcloud run services describe "${BACKEND_SERVICE}" \
      --region="${REGION}" --project="${PROJECT}" --format='value(status.url)')
  fi
  if [ -z "${API_UPSTREAM}" ]; then
    echo "ERROR: could not find the URL of ${BACKEND_SERVICE}; set API_UPSTREAM=https://<backend>" >&2
    exit 1
  fi
  echo "API upstream: ${API_UPSTREAM}"
}
