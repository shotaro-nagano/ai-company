#!/usr/bin/env bash
# 社員セッションランナー(GitHub Actions から呼ばれる中核スクリプト)
# 使い方: run_session.sh <slug> <class> [追加タスク文]
#   class: daily | weekly | monthly | event | cs | heartbeat
# 流れ: ガバナー判定 → ポーリング(承認/社長室/Stripe) → claude非対話起動 → 使用量記録 → commit/push
set -euo pipefail

SLUG="${1:?usage: run_session.sh <slug> <class> [task]}"
CLASS="${2:?class required}"
EXTRA_TASK="${3:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# 認証トークンの改行混入を除去(setup-tokenのコピー時に折り返し改行が入りやすい)。
# 純粋な折り返し改行なら除去で元のトークンに復元される。前後空白も落とす。
if [ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
  export CLAUDE_CODE_OAUTH_TOKEN="$(printf %s "$CLAUDE_CODE_OAUTH_TOKEN" | tr -d '\r\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
fi

AGENT_FILE="agents/${SLUG}.md"
[ -f "$AGENT_FILE" ] || { echo "role prompt not found: $AGENT_FILE" >&2; exit 1; }

# --- frontmatter からモデルとeffortを読む(モデル階級制・QUALITY第4節) ---
MODEL=$(awk -F': *' '/^model:/{print $2; exit}' "$AGENT_FILE")
EFFORT=$(awk -F': *' '/^effort:/{print $2; exit}' "$AGENT_FILE")
[ -n "$MODEL" ] || { echo "frontmatter に model がありません: $AGENT_FILE" >&2; exit 1; }

# 会議など特定局面の階級上書き(QUALITY第4節: 進化会議/監査=xhigh、経営会議/重要文書=high)
MODEL="${MODEL_OVERRIDE:-$MODEL}"
EFFORT="${EFFORT_OVERRIDE:-$EFFORT}"

# --- ガバナー(80%省エネ / 85%CS予備枠) ---
if ! "$SCRIPT_DIR/governor.sh" "$SLUG" "$CLASS"; then
  RC=$?
  [ "$RC" = "78" ] && { echo "governor skip"; exit 0; }
  exit "$RC"
fi

# --- セッション冒頭のポーリング(結果をプロンプトに同梱) ---
POLL_CONTEXT="$(python3 "$SCRIPT_DIR/discord_poll.py" --update-last-read 2>&1 || true)"
STRIPE_CONTEXT="$(python3 "$SCRIPT_DIR/stripe_poll.py" 2>&1 || true)"

# --- 北極星(/goal 相当)を読み込む。全セッションのプロンプト冒頭に注入する ---
GOAL_TEXT=""
[ -f "state/goal.md" ] && GOAL_TEXT="$(cat state/goal.md)"

# --- プロンプト組立(QUALITY第3節の標準手順を強制) ---
PROMPT=$(cat <<EOF
==================== 会社の北極星 /goal ====================
以下はPixelYenの全社共通の目標(北極星)です。今日のあなたの働きが、常にこの目標に
向いているかを自問しながら作業してください。「それは利益に繋がるか?」
${GOAL_TEXT}
============================================================

あなたはPixelYenの社員セッションです。以下の手順を厳守してください。

1. まず CLAUDE.md を読む(会社の地図と憲法の要点)
2. 次に自分のロールプロンプト ${AGENT_FILE} を読む(あなたの役割・判断基準・出力形式・禁止事項・完了条件)
3. state/ を読む(kpi.md / products.md / decisions.md / handoff.md)
4. 下の「ポーリング結果」を確認する(#承認待ちの承認状況・#社長室の人間の指示・Stripe売上)。
   人間の指示があれば憲法の範囲内で最優先。承認済みの掲示があれば反映する。売上があれば state/kpi.md を更新する
5. 作業前にスキルを探す(スキルファースト原則): skills/ に該当の型があればそれに従う。
   無ければ find-skills(npx -y skills@latest find "検索語")で候補を発見してよいが、
   外部スキルの導入・実行は無審査では禁止(マモル審査→進化会議の採用決議が必要)
6. handoff.md の自分宛てタスクと、本日のタスクを実行する
7. 終了前に必ず: state/ を更新し、handoff.md に次回への申し送りを書き、
   変更を git add して自分の名前で git commit する(pushはランナーが行う)
8. 最後に scripts/discord_post.sh ${SLUG} <channel> "<報告>" で所定チャンネルへ報告する
   (通常業務は log。ロールプロンプトの出力形式に従う)

制約(違反禁止):
- 現金支出・外部サービスへの新規登録は物理的に不可能かつ憲法で禁止(第2条)
- 認証情報・顧客の個人情報をファイルに書かない(公開リポジトリ)
- git push・gh コマンドでのリポジトリ設定変更はしない(ランナーの仕事)。
  例外: イベント起動の同僚(メキキ・イロハ・ツヅリ・ワタル・オキテ・マメ)を呼ぶときだけ
  scripts/dispatch_colleague.sh <slug> "<依頼内容>" を使ってよい
- 迷ったら、より制限的な解釈を採り decisions.md に記録する(第6条)

== 本日のセッション区分 ==
${CLASS}
$( [ -n "$EXTRA_TASK" ] && printf '\n== 追加タスク(このセッションの主目的) ==\n%s\n' "$EXTRA_TASK" )

== ポーリング結果 ==
${POLL_CONTEXT}

${STRIPE_CONTEXT}
EOF
)

# --- git 設定(コミットは社員名で行われるが、authorはbot共通でよい) ---
git config user.name "PixelYen"
git config user.email "pixelyen-bot@users.noreply.github.com"

# --- claude 非対話起動(fast modeは使わない。effortはhaikuでは渡さない) ---
CLAUDE_ARGS=(-p --model "$MODEL" --dangerously-skip-permissions)
case "$MODEL" in
  *haiku*) : ;;  # Haiku 4.5 は effort 非対応
  *) [ -n "$EFFORT" ] && CLAUDE_ARGS+=(--effort "$EFFORT") ;;
esac

echo "[run_session] $SLUG model=$MODEL effort=${EFFORT:-default} class=$CLASS"
set +e
claude "${CLAUDE_ARGS[@]}" "$PROMPT"
CLAUDE_RC=$?
set -e

# --- 使用量記録(失敗しても枠は消費している) ---
python3 "$SCRIPT_DIR/record_usage.py" "$SLUG" "$MODEL"

# --- commit / push(セッションがcommitし忘れた分も拾う) ---
git add -A
# GITHUB_TOKEN は .github/workflows/ を変更できない(GitHubのセキュリティ制約)。
# 混入すると state 変更まで巻き添えで push 失敗するため、ワークフロー変更は除外して人間に申し送る。
if ! git diff --cached --quiet -- .github/workflows/ 2>/dev/null; then
  git reset -q -- .github/workflows/ 2>/dev/null || true
  git checkout -q -- .github/workflows/ 2>/dev/null || true
  echo "[run_session] ワークフロー変更を検出 → 除外(自動トークンでは適用不可)"
  "$SCRIPT_DIR/discord_post.sh" mamoru approval \
    "🔧 ${SLUG} がワークフロー(.github/workflows/)の変更を提案しましたが、自動トークンでは適用できません(GitHubの仕様)。人間の適用が必要です。詳細は decisions.md と当該セッションログを参照。これは組織=稼働表の変更に相当するため、人間マターとして掲示します(憲法第8条)。" || true
fi
git diff --cached --quiet || git commit -m "${SLUG}: セッション自動記録 (${CLASS})"
for i in 1 2 3; do
  if git pull --rebase origin main && git push origin main; then
    break
  fi
  echo "[run_session] push retry $i"
  sleep $((i * 5))
done

if [ "$CLAUDE_RC" -ne 0 ]; then
  echo "[run_session] claude session failed rc=$CLAUDE_RC" >&2
  "$SCRIPT_DIR/discord_post.sh" kaketsu error "🚨 ${SLUG} のセッションが異常終了しました(rc=${CLAUDE_RC})。カケツが復旧を試みます。" || true
  exit "$CLAUDE_RC"
fi
echo "[run_session] done"
