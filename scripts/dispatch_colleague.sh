#!/usr/bin/env bash
# イベント起動の同僚を呼ぶ(repository_dispatch → event-session.yml が起動)
# 使い方: dispatch_colleague.sh <slug> <task>
# 呼べるのはイベント起動区分の社員のみ(稼働表=人件費を守る)。
set -euo pipefail
SLUG="${1:?usage: dispatch_colleague.sh <slug> <task>}"
TASK="${2:?task required}"

case "$SLUG" in
  mekiki|iroha|tsuzuri|wataru|okite|mame|kaketsu) ;;
  *) echo "イベント起動できない社員です: $SLUG(稼働表を確認)" >&2; exit 1 ;;
esac

if [ -z "${GITHUB_REPOSITORY:-}" ] || ! command -v gh >/dev/null; then
  echo "[dispatch] ローカル環境のため呼び出しをスキップ: $SLUG — $TASK" >&2
  exit 0
fi

gh api "repos/${GITHUB_REPOSITORY}/dispatches" \
  -f event_type=session \
  -f "client_payload[slug]=${SLUG}" \
  -f "client_payload[task]=${TASK}"
echo "[dispatch] ${SLUG} を呼び出しました: ${TASK}"
