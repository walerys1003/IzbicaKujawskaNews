#!/usr/bin/env bash
set -euo pipefail

TARGET_REF="${1:-HEAD~1}"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

git archive "$TARGET_REF" | tar -x -C "$TEMP_DIR"
pushd "$TEMP_DIR" >/dev/null
npm ci
npm run build
npx wrangler pages deploy dist --project-name "izbica24-portal" --branch main
popd >/dev/null
