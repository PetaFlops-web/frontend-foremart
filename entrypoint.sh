#!/bin/sh
set -e

# Hanya substitusi $BACKEND_URL — variabel nginx seperti $host, $uri, dll
# tidak tersentuh karena envsubst diberi daftar eksplisit.
envsubst '$BACKEND_URL' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "→ Backend URL: ${BACKEND_URL}"
exec nginx -g "daemon off;"
