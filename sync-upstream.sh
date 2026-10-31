#!/bin/bash
# Merge upstream omarchy.bar changes into this fork.
#
# upstream-base/ holds the upstream files the fork was last synced from. Each
# run 3-way merges upstream's changes since then into Bar.qml and BarModel.js,
# and advances the base.

set -euo pipefail

cd "$(dirname -- "${BASH_SOURCE[0]}")"

upstream_dir="$OMARCHY_PATH/shell/plugins/bar"
[[ -f $upstream_dir/Bar.qml ]] || { echo "No upstream bar at $upstream_dir" >&2; exit 1; }

if [[ -n $(git status --porcelain) ]]; then
  echo "Commit or stash local changes first" >&2
  exit 1
fi

if cmp -s upstream-base/Bar.qml "$upstream_dir/Bar.qml" && cmp -s upstream-base/BarModel.js "$upstream_dir/BarModel.js"; then
  echo "Already in sync with $(cat "$OMARCHY_PATH/version")"
  exit 0
fi

status=0
git merge-file -L fork -L base -L upstream Bar.qml upstream-base/Bar.qml "$upstream_dir/Bar.qml" || status=$?
git merge-file -L fork -L base -L upstream BarModel.js upstream-base/BarModel.js "$upstream_dir/BarModel.js" || status=$?

cp "$upstream_dir/Bar.qml" "$upstream_dir/BarModel.js" upstream-base/
printf 'source: %s\nomarchy: %s\n' "$upstream_dir" "$(cat "$OMARCHY_PATH/version")" >UPSTREAM

if (( status > 0 )); then
  echo "Merged with $status conflict(s) in Bar.qml / BarModel.js; resolve the <<<<<<< markers, then commit"
  exit 1
fi

echo "Merged upstream $(cat "$OMARCHY_PATH/version") cleanly; review with git diff, then commit"
