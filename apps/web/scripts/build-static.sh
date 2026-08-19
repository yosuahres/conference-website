#!/usr/bin/env bash
#
# Builds the public site as plain files for a host that cannot run Node, and
# leaves a zip ready to upload through cPanel's File Manager.
#
# Why a worktree rather than building in place: `output: "export"` refuses to
# build a route that needs a server at request time, and (auth), (dashboard)
# and admin all do. They have to be absent, not merely unreachable. Doing that
# to your checkout would be destructive, so the build happens in a throwaway
# worktree at the current commit and your files are never touched.
#
#   pnpm --filter web build:static
#
# Output: apps/web/dist-static/ and apps/web/dist-static.zip
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
WEB_DIR="$REPO_ROOT/apps/web"
WORKTREE="$(mktemp -d)/static-build"
OUT_DIR="$WEB_DIR/dist-static"

# Routes that only exist when something is running to serve them.
SERVER_ONLY_ROUTES=("(auth)" "(dashboard)" "admin")

cleanup() {
  git -C "$REPO_ROOT" worktree remove --force "$WORKTREE" 2>/dev/null || true
  rm -rf "$(dirname "$WORKTREE")"
}
trap cleanup EXIT

if [ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]; then
  echo "note: building from the last commit; uncommitted changes are not included." >&2
fi

echo "==> preparing an isolated worktree"
git -C "$REPO_ROOT" worktree add -q --detach "$WORKTREE" HEAD

# node_modules is not tracked, and reinstalling it into the worktree would cost
# minutes for a byte-identical tree. Point at the one already installed.
for dir in "" "/apps/web" "/apps/api" "/packages/ui" "/packages/types"; do
  if [ -d "$REPO_ROOT$dir/node_modules" ]; then
    ln -s "$REPO_ROOT$dir/node_modules" "$WORKTREE$dir/node_modules"
  fi
done

echo "==> removing server-only routes"
for route in "${SERVER_ONLY_ROUTES[@]}"; do
  # A leading underscore is App Router's opt-out marker, so the directory stays
  # readable in the build log but stops producing routes.
  if [ -d "$WORKTREE/apps/web/src/app/$route" ]; then
    mv "$WORKTREE/apps/web/src/app/$route" \
       "$WORKTREE/apps/web/src/app/_${route//[()]/}"
    echo "    $route"
  fi
done

echo "==> building"
(cd "$WORKTREE/apps/web" && STATIC_EXPORT=1 NODE_ENV=production npx next build)

echo "==> assembling"
rm -rf "$OUT_DIR" "$OUT_DIR.zip"
cp -R "$WORKTREE/apps/web/out" "$OUT_DIR"
cp "$REPO_ROOT/ops/htaccess" "$OUT_DIR/.htaccess"

# The Next starter ships sample art in public/ that no page references.
rm -f "$OUT_DIR"/{next,vercel,file,globe,window}.svg

# -y keeps symlinks as symlinks rather than following them; there are none, but
# a zip that quietly inlines one is a bad surprise. The dot-glob is needed or
# .htaccess, the whole point of the exercise, is silently left out.
(cd "$OUT_DIR" && zip -qry "$OUT_DIR.zip" . -x '.DS_Store')

echo
echo "    $OUT_DIR.zip  ($(du -h "$OUT_DIR.zip" | cut -f1), $(find "$OUT_DIR" -type f | wc -l | tr -d ' ') files)"
echo "    upload to public_html, then Extract. See docs/deploy-static-cpanel.md"
