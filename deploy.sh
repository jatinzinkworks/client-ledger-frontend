#!/usr/bin/bash
set -euo pipefail

source variables.sh

# ---------- Step 0: Validate input ------------------------------------------
echo ""
echo "=========================="
echo "[0/9] Validating input"
echo "=========================="
BUMP_TYPE="${1:-}"
if [ "${BUMP_TYPE}" != "major" ] && [ "${BUMP_TYPE}" != "minor" ]; then
  echo "Usage: $0 <major|minor>" >&2
  echo "  major - bump major version (e.g., 1.2 -> 2.0)" >&2
  echo "  minor - bump minor version (e.g., 1.2 -> 1.3)" >&2
  exit 1
fi
echo "Bump type: ${BUMP_TYPE}"

# ---------- Step 1: Preflight git checks ------------------------------------
echo ""
echo "=========================="
echo "[1/9] Preflight git checks"
echo "=========================="
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "${CURRENT_BRANCH}" != "main" ]; then
  echo "Error: must be on 'main' branch (currently on '${CURRENT_BRANCH}')" >&2
  exit 1
fi
echo "Branch: main"
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree has uncommitted changes" >&2
  git status --short >&2
  exit 1
fi
echo "Working tree: clean"

# ---------- Step 2: Read current version from version file ------------------
echo ""
echo "=========================="
echo "[2/9] Reading current version"
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

# ---------- Step 3: Compute new version -------------------------------------
echo ""
echo "=========================================="
echo "[3/9] Computing new version"
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

# ---------- Step 4: Update version file -------------------------------------
echo ""
echo "=========================================="
echo "[4/9] Updating version file"
echo "=========================================="
# If any step from here through deploy fails, revert the version file so the
# working tree returns to a clean state matching origin/main.
trap 'echo ""; echo "Reverting version file due to failure..."; git checkout -- version || true' ERR

printf "%s\n" "${NEW_VERSION}" > version
echo "version file updated: ${CURRENT_VERSION} -> ${NEW_VERSION}"

# ---------- Step 5: Build ---------------------------------------------------
echo ""
echo "=========================================="
echo "[5/9] Building Docker image"
echo "=========================================="
# APK_PATCH_BUST is a timestamp so the base image's security-patch layer is
# never served from cache: its result depends on the apk index at build time,
# which moves without the Dockerfile or the base image changing. Without it a
# release can ship a months-old cached patch layer — which is how openssl
# 3.5.7-r0 reached production while 3.5.8-r0 was already published. `--pull`
# does the same job for the base image itself.
docker build --build-arg VITE_API_BASE_URL=https://watchtower.apex.zinkworks.com \
  --build-arg APK_PATCH_BUST="$(date +%s)" --pull -t "${IMAGE}" .
echo "Build OK: ${IMAGE}"

# ---------- Step 6: Trivy security scan -------------------------------------
echo ""
echo "=========================================="
echo "[6/9] Scanning image with Trivy"
echo "=========================================="
echo "Failing on any vulnerabilities..."
docker run --rm \
  -v //var/run/docker.sock:/var/run/docker.sock \
  -v trivy-cache:/root/.cache/trivy \
  -v "/$(pwd)"://data -w //data \
  aquasec/trivy:latest --exit-code 1 --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL image "${IMAGE}"
echo "Trivy scan OK: No Vulnerabilities"

# ---------- Step 7: Push ----------------------------------------------------
echo ""
echo "=========================================="
echo "[7/9] Pushing image to Artifact Registry"
echo "=========================================="
docker push "${IMAGE}"
echo "Push OK: ${IMAGE}"

# ---------- Step 8: Deploy --------------------------------------------------
echo ""
echo "=========================================="
echo "[8/9] Deploying to Cloud Run"
echo "=========================================="
gcloud run services update "${SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --image="${IMAGE}"
echo "Deploy OK: ${SERVICE}"

# Build + deploy succeeded — disable the auto-revert trap before committing.
trap - ERR

# ---------- Step 9: Commit version, push, and tag release -------------------
echo ""
echo "=========================================="
echo "[9/9] Committing version and tagging release"
echo "=========================================="
git add version
git commit -m "Release ${NEW_VERSION}"
git push origin main
git tag -a "v${NEW_VERSION}" -m "Release ${NEW_VERSION}"
git push origin "v${NEW_VERSION}"
echo "Commit + tag OK: v${NEW_VERSION}"

# ---------- Done ------------------------------------------------------------
echo ""
echo "=========================================="
echo "SUCCESS"
echo "=========================================="
echo "Service:   ${SERVICE}"
echo "Region:    ${REGION}"
echo "Image:     ${IMAGE}"
echo "Old → New: ${CURRENT_VERSION} → ${NEW_VERSION}"
echo "Tag:       v${NEW_VERSION}"
