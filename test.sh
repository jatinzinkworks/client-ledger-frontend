#!/usr/bin/bash

source variables.sh
VERSION="test"
echo "Version: ${VERSION}"
echo "Image:   ${IMAGE}"


# ---------- Step 1: Build ---------------------------------------------------
echo ""
echo "=========================================="
echo "[1/2] Building Docker image"
echo "=========================================="
docker build --pull -t "${IMAGE}" .
echo "Build OK: ${IMAGE}"

# ---------- Step 3: Trivy security scan -------------------------------------
echo ""
echo "=========================================="
echo "[2/2] Scanning image with Trivy"
echo "=========================================="
echo "Failing on any vulnerabilities..."
docker run --rm \
  -v //var/run/docker.sock:/var/run/docker.sock \
  -v "/$(pwd)"://data -w //data \
  aquasec/trivy:latest --exit-code 1 --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL image "${IMAGE}"
echo "Trivy scan OK: No Vulnerabilities"

# ---------- Done ------------------------------------------------------------
echo ""
echo "=========================================="
echo "SUCCESS"
echo "=========================================="
echo "Service: ${SERVICE}"
echo "Region:  ${REGION}"
echo "Image:   ${IMAGE}"