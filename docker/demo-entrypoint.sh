#!/usr/bin/env bash
set -Eeuo pipefail

pg_pid=''
api_pid=''
web_pid=''
startup_pid=''
cleanup() {
  trap - EXIT TERM INT
  set +e
  for pid in "$startup_pid" "$api_pid" "$web_pid"; do
    if [[ -n "$pid" ]]; then kill -TERM "$pid" 2>/dev/null; fi
  done
  if [[ -s "$PGDATA/postmaster.pid" ]]; then
    gosu postgres pg_ctl -D "$PGDATA" -m fast -w -t 10 stop >/dev/null 2>&1
  fi
  # Before exec(postgres), this PID is the initializer shell; TERM works in both phases.
  if [[ -n "$pg_pid" ]]; then kill -TERM "$pg_pid" 2>/dev/null; fi
  deadline=$((SECONDS + 10))
  while ((SECONDS < deadline)); do
    alive=false
    for pid in "$startup_pid" "$api_pid" "$web_pid" "$pg_pid"; do
      if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then alive=true; fi
    done
    if [[ "$alive" == false ]]; then break; fi
    sleep 0.2
  done
  for pid in "$startup_pid" "$api_pid" "$web_pid" "$pg_pid"; do
    if [[ -n "$pid" ]]; then kill -KILL "$pid" 2>/dev/null; fi
  done
  wait
}
trap cleanup EXIT
trap 'exit 0' TERM INT

run_startup() {
  "$@" &
  startup_pid=$!
  wait "$startup_pid"
  startup_pid=''
}

# Dedicated demo volume: secrets survive container recreation with the database.
install -d -m 755 /var/lib/brewlite
umask 077
for name in db-password jwt-secret; do
  file="/var/lib/brewlite/$name"
  if [[ ! -s "$file" ]]; then
    node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" > "$file"
  fi
done
export POSTGRES_PASSWORD="$(cat /var/lib/brewlite/db-password)"
export JWT_SECRET="$(cat /var/lib/brewlite/jwt-secret)"
export DATABASE_URL="postgresql://brewlite:${POSTGRES_PASSWORD}@127.0.0.1:5432/brewlite?schema=public"

docker-entrypoint.sh postgres -c listen_addresses=127.0.0.1 &
pg_pid=$!

# The official init server is socket-only; wait for the final authenticated TCP server.
ready=false
for ((attempt = 0; attempt < 120; attempt++)); do
  if PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U brewlite -d brewlite -c 'SELECT 1' >/dev/null 2>&1; then
    ready=true
    break
  fi
  if ! kill -0 "$pg_pid" 2>/dev/null; then
    echo 'PostgreSQL exited before startup completed.' >&2
    exit 1
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  echo 'PostgreSQL did not become ready within 120 seconds.' >&2
  exit 1
fi

cd /app/api
run_startup gosu brewlite node node_modules/prisma/build/index.js migrate deploy
run_startup gosu brewlite node --import tsx prisma/seed.ts
PORT=4000 gosu brewlite node dist/main.js &
api_pid=$!

cd /app/web
HOSTNAME=0.0.0.0 PORT=3000 gosu brewlite node server.js &
web_pid=$!

# ponytail: one supervised process group for a local demo; use separate services for independent scaling.
set +e
wait -n "$pg_pid" "$api_pid" "$web_pid"
status=$?
set -e
echo 'A demo service exited; stopping the container.' >&2
if [[ "$status" == 0 ]]; then exit 1; fi
exit "$status"
