#!/usr/bin/env bash
# イベント起動の同僚を呼ぶ(repository_dispatch → event-session.yml が起動)
# 使い方: dispatch_colleague.sh <slug> <task> [acceptance-criteria-path]
#   acceptance-criteria-path: 必須成果物のファイルパス(省略可・リポルート相対)。
#     指定するとセッション後に run_session.sh が存在確認し、未着地なら #エラー へ通知する。
# 呼べるのはイベント起動区分の社員のみ(稼働表=人件費を守る)。
set -euo pipefail
SLUG="${1:?usage: dispatch_colleague.sh <slug> <task> [acceptance-criteria-path]}"
TASK="${2:?task required}"
ACCEPTANCE_CRITERIA="${3:-}"

case "$SLUG" in
  mekiki|iroha|tsuzuri|wataru|okite|mame|kaketsu) ;;
  *) echo "イベント起動できない社員です: $SLUG(稼働表を確認)" >&2; exit 1 ;;
esac

# acceptance-criteriaが指定された場合、タスク文に自己検証の指示を埋め込む
FULL_TASK="$TASK"
if [ -n "$ACCEPTANCE_CRITERIA" ]; then
  FULL_TASK="${TASK}

[acceptance-criteria: ${ACCEPTANCE_CRITERIA}]
⚠️ 上記パスに Writeツールで実ファイルを作成すること。終了前に必ず \`ls ${ACCEPTANCE_CRITERIA}\` で存在を自己検証し、\`git log --oneline -3\` でコミット実在を確認すること。ファイルが存在しなければセッション完了とみなされない。"
fi

if [ -z "${GITHUB_REPOSITORY:-}" ] || ! command -v gh >/dev/null; then
  echo "[dispatch] ローカル環境のため呼び出しをスキップ: $SLUG — $FULL_TASK" >&2
  exit 0
fi

gh api "repos/${GITHUB_REPOSITORY}/dispatches" \
  -f event_type=session \
  -f "client_payload[slug]=${SLUG}" \
  -f "client_payload[task]=${FULL_TASK}"
echo "[dispatch] ${SLUG} を呼び出しました: ${TASK}"
[ -n "$ACCEPTANCE_CRITERIA" ] && echo "[dispatch] acceptance-criteria: ${ACCEPTANCE_CRITERIA}"
