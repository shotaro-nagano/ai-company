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

# acceptance-criteriaが指定された場合、タスク文に自己検証の指示を埋め込む。
# 進化会議#037(2026-07-15): narration先行を"順序"で構造的に潰す。報告より先にファイルを実在させる。
FULL_TASK="$TASK"
if [ -n "$ACCEPTANCE_CRITERIA" ]; then
  FULL_TASK="${TASK}

[acceptance-criteria: ${ACCEPTANCE_CRITERIA}]
⚠️ 順序強制ルール(進化会議#037・narration先行の構造的防止):
① まず最初のアクションとして \`${ACCEPTANCE_CRITERIA}\` を Writeツールで作成せよ(空・見出しだけでもよい)。中身の執筆はその後に追記する。「作った」と報告する前に、ファイルが実在している状態を先に作ること。
② 大きな新規物を一度に完成させようとしない。既存ファイルへ1セクションずつ追記してよい(進化会議#037・増分ドラフト標準)。少しでも書けたら都度その状態を残す。
③ 終了前に必ず \`ls ${ACCEPTANCE_CRITERIA}\` で存在を、\`git log --oneline -3\` でコミット実在を自己検証せよ。ファイルが存在しなければセッションは完了とみなされない(報告文だけで完了としない)。"
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
