#!/usr/bin/env bash
# Discord Webhook投稿(社員ごとに username / avatar_url を出し分け)
# 使い方: discord_post.sh <slug> <channel> <message>
#   channel: approval | sales | weekly | meeting | log | error
# Webhook URLは環境変数 DISCORD_WEBHOOK_<CHANNEL大文字> で渡す。
# 未設定なら警告だけ出して正常終了する(保留機能で建国を止めない方針)。
set -euo pipefail

SLUG="${1:?usage: discord_post.sh <slug> <channel> <message>}"
CHANNEL="${2:?channel required}"
MESSAGE="${3:?message required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

case "$CHANNEL" in
  approval) WEBHOOK="${DISCORD_WEBHOOK_APPROVAL:-}" ;;
  sales)    WEBHOOK="${DISCORD_WEBHOOK_SALES:-}" ;;
  weekly)   WEBHOOK="${DISCORD_WEBHOOK_WEEKLY:-}" ;;
  meeting)  WEBHOOK="${DISCORD_WEBHOOK_MEETING:-}" ;;
  log)      WEBHOOK="${DISCORD_WEBHOOK_LOG:-}" ;;
  error)    WEBHOOK="${DISCORD_WEBHOOK_ERROR:-}" ;;
  *) echo "unknown channel: $CHANNEL" >&2; exit 1 ;;
esac

if [ -z "$WEBHOOK" ]; then
  echo "[discord_post] webhook for '$CHANNEL' not set — skipped (message follows)" >&2
  echo "$MESSAGE" >&2
  exit 0
fi

NAME=$(python3 -c "import json,sys; e=json.load(open('$REPO_ROOT/scripts/employees.json')); i=e.get('$SLUG',{}); print(f\"{i.get('name','$SLUG')}|{i.get('role','')}\")")
DISPLAY_NAME="${NAME%%|*}"
ROLE="${NAME##*|}"
USERNAME="$DISPLAY_NAME($ROLE)"

# アバターURL: GitHub Actions上では GITHUB_REPOSITORY からrawのURLを組み立てる
AVATAR_URL=""
if [ -n "${GITHUB_REPOSITORY:-}" ]; then
  AVATAR_URL="https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/assets/discord/${SLUG}.png"
fi

python3 - "$USERNAME" "$AVATAR_URL" "$MESSAGE" "$WEBHOOK" <<'PY'
import json, sys, urllib.request
username, avatar_url, message, webhook = sys.argv[1:5]
# Discordの1メッセージ上限は2000文字。超える場合は分割して送る
chunks = [message[i:i+1900] for i in range(0, len(message), 1900)] or [""]
for chunk in chunks:
    payload = {"username": username, "content": chunk}
    if avatar_url:
        payload["avatar_url"] = avatar_url
    req = urllib.request.Request(
        webhook,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    urllib.request.urlopen(req, timeout=15)
print("[discord_post] sent", len(chunks), "chunk(s)")
PY
