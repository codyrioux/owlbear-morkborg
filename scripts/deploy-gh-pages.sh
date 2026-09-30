#!/usr/bin/env bash
set -euo pipefail

echo "==> Building MÖRK BORG production bundle..."
bun run build

echo "==> Deploying dist/ to gh-pages branch..."
TMP_INDEX=$(mktemp -u)
export GIT_INDEX_FILE="$TMP_INDEX"
trap 'rm -f "$TMP_INDEX"' EXIT

git --work-tree=dist add -f .
TREE=$(git --work-tree=dist write-tree)

PARENT_COMMIT=$(git rev-parse --verify refs/heads/gh-pages 2>/dev/null || true)

if [ -n "$PARENT_COMMIT" ]; then
  COMMIT=$(git commit-tree "$TREE" -p "$PARENT_COMMIT" -m "Deploy MÖRK BORG extension to GitHub Pages")
else
  COMMIT=$(git commit-tree "$TREE" -m "Initial deploy of MÖRK BORG extension to GitHub Pages")
fi

git update-ref refs/heads/gh-pages "$COMMIT"
echo "==> Successfully created / updated local 'gh-pages' branch!"
echo "==> Commit: $COMMIT"
echo "==> You can publish to GitHub with:"
echo "    git push origin main"
echo "    git push origin gh-pages"
