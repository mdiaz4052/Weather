#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo 'Install Node.js 22.12+ from nodejs.org, then run setup again.'; exit 1; }
command -v python3 >/dev/null || { echo 'Install Python 3.12+ from python.org, then run setup again.'; exit 1; }
python3 -c 'import sys; assert sys.version_info >= (3,12), "Python 3.12 or later required"'
npm ci
python3 -m venv .venv
.venv/bin/pip install --require-hashes -r services/weather-api/requirements.lock
.venv/bin/pip install --no-deps -e services/weather-api
printf 'Setup complete. Open Start Weather.command to launch.\n'
