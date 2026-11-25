#!/usr/bin/env bash
# Work out the next release tag.
#
# Usage: git tag --list 'v*' | next-version.sh <major|minor|patch>
#
# Reads tag names on stdin. Only plain vMAJOR.MINOR.PATCH tags count (no
# pre-release suffixes). With no such tag the base is v0.0.0.
# Prints two lines, ready to append to $GITHUB_OUTPUT:
#   previous=<latest tag, empty if none>
#   next=<bumped tag>
set -euo pipefail

bump="${1:-}"
case "$bump" in
  major | minor | patch) ;;
  *) echo "usage: next-version.sh <major|minor|patch> < tags" >&2; exit 2 ;;
esac

previous="$(grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1 || true)"
base="${previous:-v0.0.0}"
IFS=. read -r major minor patch <<< "${base#v}"

case "$bump" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac

echo "previous=$previous"
echo "next=v$major.$minor.$patch"
