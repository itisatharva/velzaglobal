#!/usr/bin/env bash
#
# Post-deploy verification for velzaglobal.com.
#
#   ./deployment/verify-deploy.sh                        # production
#   ./deployment/verify-deploy.sh https://staging.velzaglobal.com
#
# Answers "did the deploy actually go live?" - the question curl can only
# answer awkwardly by hand. Four checks, exits non-zero if any fail, so it
# can gate a release.
#
# Local testing only. deployment/ is rsync-excluded in .cpanel.yml and
# never reaches the webroot.

set -uo pipefail

SITE="${1:-https://www.velzaglobal.com}"
SITE="${SITE%/}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

FAILED=0
PURGE_NEEDED=()

red()   { printf '\033[31m%s\033[0m' "$1"; }
green() { printf '\033[32m%s\033[0m' "$1"; }
dim()   { printf '\033[2m%s\033[0m'  "$1"; }

# macOS ships `md5`, the cPanel host ships `md5sum`.
md5of() {
    if command -v md5 >/dev/null 2>&1; then md5 -q "$1"
    else md5sum "$1" | cut -d' ' -f1
    fi
}
md5stdin() {
    if command -v md5 >/dev/null 2>&1; then md5 -q
    else md5sum | cut -d' ' -f1
    fi
}

# Header value after following the apex->www redirect: take the LAST match,
# since the 301 hop carries its own headers.
header_of() {
    curl -sSI -L --max-time 20 "$1" 2>/dev/null | tr -d '\r' \
        | grep -i "^$2:" | tail -1 | cut -d' ' -f2- | sed 's/[[:space:]]*$//'
}

status_of() {
    curl -sS -o /dev/null -L --max-time 20 -w '%{http_code}' "$1" 2>/dev/null
}

check() { # check <label> <expected-substring> <actual>
    local label="$1" want="$2" got="$3"
    if [[ "$got" == *"$want"* ]]; then
        printf '  %-44s %-26s %s\n' "$label" "$got" "$(green OK)"
    else
        printf '  %-44s %-26s %s\n' "$label" "${got:-<none>}" "$(red FAIL)"
        printf '  %-44s %s\n' "" "$(dim "expected: $want")"
        FAILED=$((FAILED + 1))
    fi
}

echo
echo "Verifying $SITE"
echo "Repo: $REPO"

# ----------------------------------------------------------------------
echo
echo "1. SITE IS UP"
# A malformed .htaccess 500s everything - catch that before anything else.
for path in / /favicon.ico /robots.txt; do
    code="$(status_of "$SITE$path")"
    check "$path" "200" "$code"
done

# ----------------------------------------------------------------------
echo
echo "2. CACHE HEADERS  (.htaccess section 14)"
# Cache-busted so this measures what the ORIGIN is configured to send.
# Whether the edge has caught up is a separate question, owned by check 4 -
# testing the plain URL here would report one problem as two.
echo "   icons + manifest: short TTL so the next change propagates in a day"
for path in /favicon.ico /apple-touch-icon.png /site.webmanifest \
            /shared/images/favicon-32x32.png /shared/images/android-chrome-512x512.png; do
    check "$path" "max-age=86400" "$(header_of "$SITE$path?cfbust=$RANDOM" cache-control)"
done

echo "   content assets: must still cache hard for a year"
for path in /shared/images/Home.webp /shared/images/curtain-background-left.svg \
            /shared/css/theme.css /shared/js/theme.js; do
    check "$path" "max-age=31536000" "$(header_of "$SITE$path?cfbust=$RANDOM" cache-control)"
done

echo "   HTML: region-dependent, must never be cached by a shared cache"
check "/ (homepage)" "no-cache" "$(header_of "$SITE/" cache-control)"

# ----------------------------------------------------------------------
echo
echo "3. ICON BYTES  (live vs repo)"
# The check that actually proves the files were copied, not just that the
# server answers 200 with something.
icon_paths=(
    "favicon.ico"
    "apple-touch-icon.png"
    "shared/images/favicon-16x16.png"
    "shared/images/favicon-32x32.png"
    "shared/images/favicon-96x96.png"
    "shared/images/apple-touch-icon-180x180.png"
    "shared/images/android-chrome-192x192.png"
    "shared/images/android-chrome-512x512.png"
    "shared/images/mstile-150x150.png"
)
for rel in "${icon_paths[@]}"; do
    if [[ ! -f "$REPO/$rel" ]]; then
        printf '  %-56s %s\n' "$rel" "$(red 'MISSING IN REPO')"
        FAILED=$((FAILED + 1))
        continue
    fi
    want="$(md5of "$REPO/$rel")"
    # Cache-bust so this compares the ORIGIN's bytes, not a stale edge copy.
    got="$(curl -sSL --max-time 30 "$SITE/$rel?verify=$RANDOM" | md5stdin)"
    if [[ "$want" == "$got" ]]; then
        printf '  %-56s %s\n' "$rel" "$(green MATCH)"
    else
        printf '  %-56s %s\n' "$rel" "$(red MISMATCH)"
        printf '  %-56s %s\n' "" "$(dim "repo $want  live $got")"
        FAILED=$((FAILED + 1))
    fi
done

# ----------------------------------------------------------------------
echo
echo "4. CLOUDFLARE EDGE  (/shared/ is cached hard - see DEPLOY.md 5b)"
# Compare what the edge serves against what the origin says right now.
# A mismatch means a pre-deploy copy is still being served from cache.
for rel in shared/images/favicon-32x32.png shared/images/android-chrome-512x512.png \
           shared/images/favicon-16x16.png shared/images/favicon-96x96.png \
           shared/css/theme.css shared/js/theme.js; do
    edge_cc="$(header_of "$SITE/$rel" cache-control)"
    edge_st="$(header_of "$SITE/$rel" cf-cache-status)"
    origin_cc="$(header_of "$SITE/$rel?cfbust=$RANDOM" cache-control)"
    if [[ "$edge_cc" == "$origin_cc" ]]; then
        printf '  %-50s %-10s %s\n' "$rel" "${edge_st:--}" "$(green 'in sync')"
    else
        printf '  %-50s %-10s %s\n' "$rel" "${edge_st:--}" "$(red 'STALE AT EDGE')"
        printf '  %-50s %s\n' "" "$(dim "edge: $edge_cc   origin: $origin_cc")"
        PURGE_NEEDED+=("$rel")
    fi
done

# ----------------------------------------------------------------------
echo
if (( ${#PURGE_NEEDED[@]} > 0 )); then
    echo "$(red "Cloudflare purge needed") - ${#PURGE_NEEDED[@]} path(s) serving pre-deploy copies:"
    for p in "${PURGE_NEEDED[@]}"; do echo "    $SITE/$p"; done
    echo "  Cloudflare > Caching > Configuration > Purge Everything"
    echo "  (edge caches are per-PoP, so this can look fine from one location"
    echo "   and stale from another - purge rather than trusting one result)"
    echo
fi

if (( FAILED > 0 )); then
    echo "$(red "FAILED") - $FAILED check(s) did not pass."
    exit 1
fi

echo "$(green "All checks passed.")"
# A pending purge is not a failed deploy: the origin is correct, the edge
# just has not caught up. Flag it loudly, but do not fail the run.
exit 0
