#!/usr/bin/bash
set -euo pipefail

source variables.sh

BUMP_TYPE="dev"
echo "Bump type: ${BUMP_TYPE}"
resolve_api_upstream

# ---------- Step : Read current version from version file ------------------
echo ""
echo "=========================="
echo "[1] Reading current version"
echo "=========================="
if [ ! -f "version" ]; then
  echo "Error: version file is missing" >&2
  exit 1
fi
CURRENT_VERSION=$(tr -d '[:space:]' < version)
if [ -z "${CURRENT_VERSION}" ]; then
  echo "Error: version file is empty" >&2
  exit 1
fi
echo "Current version: ${CURRENT_VERSION}"

# ---------- Step : Compute new version -------------------------------------
echo ""
echo "=========================================="
echo "[2] Computing new version"
echo "=========================================="
if [ ! -x "./get_new_version.sh" ]; then
  echo "ERROR: ./get_new_version.sh not found or not executable" >&2
  exit 1
fi
NEW_VERSION=$(./get_new_version.sh "${CURRENT_VERSION}" "${BUMP_TYPE}")
if [ -z "${NEW_VERSION}" ]; then
  echo "ERROR: get_new_version.sh returned an empty version" >&2
  exit 1
fi
if [ "${NEW_VERSION}" = "${CURRENT_VERSION}" ]; then
  echo "ERROR: new version (${NEW_VERSION}) equals current version" >&2
  exit 1
fi
IMAGE="${REPO}:${NEW_VERSION}"
echo "New version: ${NEW_VERSION}"
echo "Image:       ${IMAGE}"

# ---------- Step : Build ---------------------------------------------------
echo ""
echo "=========================================="
echo "[3] Building Docker image"
echo "=========================================="
# APK_PATCH_BUST: a fresh timestamp keeps the OS security-patch layer out of the
# build cache — see the note in deploy.sh. No VITE_API_BASE_URL: the bundle calls its own
# origin and nginx proxies /psc to API_UPSTREAM, set on the Cloud Run service below.
docker build \
  --build-arg APK_PATCH_BUST="$(date +%s)" \
  --build-arg VITE_IDP_LOGOUT_URL=https://login.microsoftonline.com/041daa82-3257-4a99-b7de-d0118b3ed5b4/oauth2/v2.0/logout \
  --build-arg VITE_LOGOUT_URL=/?gcp-iap-mode=CLEAR_LOGIN_COOKIE \
  --pull -t "${IMAGE}" .
echo "Build OK: ${IMAGE}"

# ---------- Step : Push ----------------------------------------------------
echo ""
echo "=========================================="
echo "[4] Pushing image to Artifact Registry"
echo "=========================================="
docker push "${IMAGE}"
echo "Push OK: ${IMAGE}"

# ---------- Step : Deploy --------------------------------------------------
echo ""
echo "=========================================="
echo "[5] Deploying to Cloud Run"
echo "=========================================="
gcloud run services update "${SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --image="${IMAGE}" \
  --update-env-vars="API_UPSTREAM=${API_UPSTREAM}"
echo "Deploy OK: ${SERVICE}"

# Build + deploy succeeded — disable the auto-revert trap before committing.
trap - ERR

# ---------- Done ------------------------------------------------------------
echo ""
echo "=========================================="
echo "SUCCESS"
echo "=========================================="
echo "Service:   ${SERVICE}"
echo "Region:    ${REGION}"
echo "Image:     ${IMAGE}"
echo "Version:   ${NEW_VERSION}"
