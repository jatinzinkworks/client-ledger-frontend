# Web app image (apps/web). The mobile app is not part of this image — it ships through Expo.

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:22-alpine AS deps

# The repo is a pnpm workspace; pin the same pnpm as package.json's packageManager.
RUN npm install -g pnpm@12.6.0

WORKDIR /app

# Manifests first, so source edits don't invalidate the install layer. Every workspace
# manifest is copied (mobile included) because the lockfile covers all of them, but only
# the web app and the packages it uses are installed — the Expo toolchain stays out.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/api/package.json packages/api/
COPY packages/schemas/package.json packages/schemas/
COPY packages/tokens/package.json packages/tokens/
RUN pnpm install --frozen-lockfile --filter "@cl/web..."

# ── Stage 2: Test + build ─────────────────────────────────────────────────────
FROM deps AS builder

COPY . .

# Run the unit tests of the web app and the shared packages it uses — the build fails
# if any test fails.
RUN pnpm --filter "@cl/web..." test

# Baked into the JS bundle at build time: Vite inlines import.meta.env.VITE_*.
#
# VITE_API_BASE_URL is normally left unset: .env keeps it empty, so the browser calls the
# app's own origin and nginx (stage 3) proxies /psc to the backend. The backend sends no
# CORS headers, so a full URL only works for a backend that allows this origin.
#
#   docker build --build-arg VITE_IDP_LOGOUT_URL=https://login.microsoftonline.com/<tenant>/oauth2/v2.0/logout .
#
# ARG without a matching ENV is deliberate. `ARG X` + `ENV X=${X}` sets X to the
# empty string when no --build-arg is passed, and an empty value *overrides*
# .env — silently blanking config that .env had supplied. With ARG alone the
# variable is simply unset, so .env remains the fallback, while a value that is
# passed still reaches the build.
ARG VITE_API_BASE_URL
ARG VITE_IDP_LOGOUT_URL
ARG VITE_LOGOUT_URL

RUN echo ">>> VITE_API_BASE_URL   : ${VITE_API_BASE_URL:-(unset — using .env)}" && \
    echo ">>> VITE_IDP_LOGOUT_URL : ${VITE_IDP_LOGOUT_URL:-(unset — using .env)}" && \
    echo ">>> VITE_LOGOUT_URL     : ${VITE_LOGOUT_URL:-(unset — using .env)}"

# These values cannot be changed after this point, so a wrong one ships to
# production unnoticed. Check the built output rather than the build args: the
# value may legitimately come from .env instead of --build-arg, and only the
# bundle shows what was actually inlined.
RUN pnpm --filter @cl/web build && \
    if grep -rq "localhost:8080" apps/web/dist/assets/*.js; then \
      echo "ERROR: the built bundle points at localhost:8080."; \
      echo "Leave VITE_API_BASE_URL empty (same-origin via the nginx proxy) or pass a deployed URL."; \
      exit 1; \
    fi

# ── Stage 3: Serve (non-root) ─────────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

# Security: patch all base-image OS packages. The Trivy scan flags only Alpine
# OS-package CVEs (openssl/libssl3/libcrypto3, libexpat, busybox, curl, libxml2,
# libpng, zlib, xz, nghttp2, c-ares, …) — nothing in the app/npm layer. Their
# fixes are published in the base image's own Alpine branch, so `apk upgrade`
# pulls them in.
#
# APK_PATCH_BUST exists because this layer is the one Docker most wants to cache
# and least should: its output depends on the apk index at build time, which
# changes without the Dockerfile or the base image changing. A cached layer is
# how the image shipped openssl 3.5.7-r0 (20 CVEs, 2 HIGH) while 3.5.8-r0 was
# already published. The deploy scripts pass a fresh timestamp so the layer is
# rebuilt on every release; the default below only matters for a bare
# `docker build`, so bump it when patching by hand.
USER root

# The last line prints the patched openssl into the build log, so a later scan
# finding can be read against what this layer actually installed (`|| true`
# because a log line must never be what fails a build).
ARG APK_PATCH_BUST=2
RUN echo "apk security-patch layer, bust=${APK_PATCH_BUST}" && \
    apk update && \
    apk upgrade --no-cache libcrypto3 libssl3 libexpat p11-kit p11-kit-trust c-ares curl libcurl && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/* && \
    { echo ">>> patched openssl:"; apk list --installed | grep -E "^libssl3|^libcrypto3" || true; }

USER 101

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

# API_UPSTREAM is read at container start: docker-entrypoint.sh substitutes it into
# nginx.conf.template as the target of the /psc proxy, e.g.
#
#   docker run -e API_UPSTREAM=https://client-ledger-backend-xxxx.a.run.app -p 8080:8080 <image>
#
# The VITE_* values are not runtime settings — they were fixed in the bundle above.
ENV API_UPSTREAM=""

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1
