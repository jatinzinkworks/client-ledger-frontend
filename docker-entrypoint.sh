#!/bin/sh
set -e

envsubst '$VITE_API_BASE_URL' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/conf.d/default.conf

exec "$@"
