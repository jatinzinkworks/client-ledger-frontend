# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Run unit tests — build fails if any test fails
RUN npm test

# Baked into the JS bundle at build time: Vite inlines import.meta.env.VITE_*,
# and the axios client uses VITE_API_BASE_URL as its baseURL so the browser
# calls the backend directly (cross-origin). The backend must therefore allow
# the frontend origin via CORS.
#
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com \
#                --build-arg VITE_IDP_LOGOUT_URL=https://login.microsoftonline.com/<tenant>/oauth2/v2.0/logout
#
# ARG without a matching ENV is deliberate. `ARG X` + `ENV X=${X}` sets X to the
# empty string when no --build-arg is passed, and an empty value *overrides*
# .env — silently blanking config that .env had supplied. With ARG alone the
# variable is simply unset, so .env remains the fallback, while a value that is
# passed still reaches `npm run build`.
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
RUN npm run build && \
    if grep -rq "localhost:8080" dist/assets/*.js; then \
      echo "ERROR: the built bundle points at localhost:8080."; \
      echo "Pass --build-arg VITE_API_BASE_URL=https://<backend> (or fix .env)."; \
      exit 1; \
    fi

# ── Stage 2: Serve (non-root) ─────────────────────────────────────────────────
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

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

# Only VITE_API_BASE_URL is needed at runtime: docker-entrypoint.sh substitutes
# it into nginx.conf.template. VITE_IDP_LOGOUT_URL and VITE_LOGOUT_URL are read
# by the browser bundle, which was fixed at build time, so setting them here
# would change nothing and only suggest otherwise.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1
