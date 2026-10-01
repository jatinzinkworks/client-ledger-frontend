#!/bin/sh
set -e

# The /psc proxy needs a backend to point at; fail at start-up rather than serve an app
# whose every API call returns 502.
if [ -z "${API_UPSTREAM}" ]; then
  echo "ERROR: API_UPSTREAM is not set. Pass the backend origin, e.g." >&2
  echo "  -e API_UPSTREAM=https://client-ledger-backend-xxxx.a.run.app" >&2
  exit 1
fi
# A trailing slash would make nginx rewrite /psc/... to /..., dropping the API prefix.
API_UPSTREAM="${API_UPSTREAM%/}"
export API_UPSTREAM

envsubst '$API_UPSTREAM' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/conf.d/default.conf

exec "$@"
