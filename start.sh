#!/bin/bash
cd "$(dirname "$0")"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ 2>/dev/null | grep -q "200"; then
  exit 0
fi

fuser -k 5000/tcp 2>/dev/null
sleep 1
rm -f /tmp/app_server.lock

export NODE_ENV=development
exec npx tsx server/index.ts
