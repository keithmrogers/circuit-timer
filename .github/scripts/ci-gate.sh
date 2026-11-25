#!/usr/bin/env bash
# Decide whether the commit being released has passed CI.
#
# Usage: gh run list --workflow ci.yml --commit <sha> --event push \
#          --json status,conclusion,url | ci-gate.sh
#
# Reads the JSON array of ci runs for that commit on stdin. Exits 0 if one
# succeeded, otherwise exits 1 with an explanation.
set -euo pipefail

runs="$(cat)"

if jq -e 'any(.[]; .conclusion == "success")' <<< "$runs" > /dev/null; then
  echo "CI passed for this commit."
  exit 0
fi

if jq -e 'any(.[]; .status != "completed")' <<< "$runs" > /dev/null; then
  echo "::error::CI is still running for this commit. Run the release again once it finishes."
elif jq -e 'length == 0' <<< "$runs" > /dev/null; then
  echo "::error::No CI run found for this commit on main. Wait for ci to start, or check that the ci workflow ran."
else
  echo "::error::CI did not pass for this commit. Fix main first, then release."
fi
jq -r '.[] | "  \(.status)/\(.conclusion): \(.url)"' <<< "$runs" >&2
exit 1
