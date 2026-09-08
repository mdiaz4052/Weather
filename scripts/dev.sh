#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -x .venv/bin/python || ! -d node_modules ]]; then
  echo 'First run: follow the one-time setup in README.md.'
  exit 1
fi
.venv/bin/uvicorn weather_api.app:app --host 127.0.0.1 --port 8000 &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT INT TERM
npm run dev -- "$@"
