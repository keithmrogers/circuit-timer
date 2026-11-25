#!/usr/bin/env bash
# Point a compose file at a new image tag.
#
# Usage: bump-compose.sh <compose.yaml> <image without tag> <new tag>
#   e.g. bump-compose.sh stacks/circuit-timer/compose.yaml ghcr.io/keithmrogers/circuit-timer v0.4.0
#
# Rewrites the single `image: <image>:v...` line. Fails if that line is not
# found exactly once, or if it already has the new tag (nothing to bump).
set -euo pipefail

file="${1:?compose file}"
image="${2:?image name}"
tag="${3:?new tag}"

re_image="$(printf '%s' "$image" | sed 's/[.[\*^$/]/\\&/g')"
pattern="^([[:space:]]*image:[[:space:]]*)${re_image}:v[0-9][^[:space:]]*[[:space:]]*\$"

count="$(grep -cE "$pattern" "$file" || true)"
if [ "$count" != 1 ]; then
  echo "::error::Expected exactly one '$image:v...' image line in $file, found $count."
  exit 1
fi

if grep -qE "^[[:space:]]*image:[[:space:]]*${re_image}:${tag}[[:space:]]*\$" "$file"; then
  echo "::error::$file already uses $image:$tag. Nothing to bump."
  exit 1
fi

sed -E -i "s|${pattern}|\1${image}:${tag}|" "$file"
grep -E "^[[:space:]]*image:[[:space:]]*${re_image}:" "$file"
