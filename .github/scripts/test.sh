#!/usr/bin/env bash
# Local checks for the release scripts. Run: .github/scripts/test.sh
set -uo pipefail
cd "$(dirname "$0")"
fails=0

check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "ok   $1"; else echo "FAIL $1: expected [$2] got [$3]"; fails=$((fails + 1)); fi
}

ver() { printf '%s\n' "${@:2}" | ./next-version.sh "$1" 2>&1 | tr '\n' ' '; }

check "minor"                 "previous=v0.3.0 next=v0.4.0 "   "$(ver minor v0.1.0 v0.2.0 v0.3.0)"
check "patch"                 "previous=v0.3.0 next=v0.3.1 "   "$(ver patch v0.3.0)"
check "major"                 "previous=v0.3.0 next=v1.0.0 "   "$(ver major v0.3.0)"
check "numeric not lexical"   "previous=v0.10.0 next=v0.11.0 " "$(ver minor v0.9.0 v0.10.0 v0.2.0)"
check "ignores prerelease"    "previous=v0.3.0 next=v0.4.0 "   "$(ver minor v0.3.0 v0.9.0-rc1 v1.0.0-beta)"
check "ignores other tags"    "previous=v0.3.0 next=v0.3.1 "   "$(ver patch v0.3.0 latest v1 foo)"
check "no tags"               "previous= next=v0.1.0 "         "$(ver minor)"
check "patch carries minor"   "previous=v1.2.9 next=v1.2.10 "  "$(ver patch v1.2.9)"
check "minor resets patch"    "previous=v1.2.9 next=v1.3.0 "   "$(ver minor v1.2.9)"
./next-version.sh bogus < /dev/null > /dev/null 2>&1; check "bad bump exits 2" 2 $?

ok='[{"status":"completed","conclusion":"failure","url":"u1"},{"status":"completed","conclusion":"success","url":"u2"}]'
running='[{"status":"in_progress","conclusion":"","url":"u3"}]'
failed='[{"status":"completed","conclusion":"failure","url":"u4"}]'
echo "$ok" | ./ci-gate.sh > /dev/null 2>&1;      check "gate: success"  0 $?
echo "$running" | ./ci-gate.sh > /dev/null 2>&1; check "gate: running"  1 $?
echo "$failed" | ./ci-gate.sh > /dev/null 2>&1;  check "gate: failed"   1 $?
echo '[]' | ./ci-gate.sh > /dev/null 2>&1;       check "gate: none"     1 $?

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
img=ghcr.io/keithmrogers/circuit-timer
mk() { printf '%s\n' "services:" "  s:" "    # ghcr.io/keithmrogers/circuit-timer is built by CI" "$@" > "$tmp/c.yaml"; }
mk "    image: $img:v0.3.0" "    restart: always"
./bump-compose.sh "$tmp/c.yaml" "$img" v0.4.0 > /dev/null; check "bump: exit 0" 0 $?
check "bump: line changed" "    image: $img:v0.4.0" "$(grep 'image:' "$tmp/c.yaml")"
check "bump: rest intact" "3" "$(grep -c -e restart -e '# ghcr' -e services "$tmp/c.yaml")"
./bump-compose.sh "$tmp/c.yaml" "$img" v0.4.0 > /dev/null 2>&1; check "bump: same tag fails" 1 $?
mk "    image: nginx:1" ; ./bump-compose.sh "$tmp/c.yaml" "$img" v0.4.0 > /dev/null 2>&1; check "bump: none fails" 1 $?
mk "    image: $img:v0.3.0" "    image: $img:v0.2.0"; ./bump-compose.sh "$tmp/c.yaml" "$img" v0.4.0 > /dev/null 2>&1; check "bump: two fails" 1 $?
mk "    image: ${img}x:v0.3.0"; ./bump-compose.sh "$tmp/c.yaml" "$img" v0.4.0 > /dev/null 2>&1; check "bump: other image fails" 1 $?

exit "$fails"
