#!/bin/bash
cd "$(dirname "$0")"
bash scripts/setup.sh
result=$?
read -r -p 'Press Return to close.'
exit "$result"
