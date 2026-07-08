#!/usr/bin/env bash
# 使用量ガバナー(憲法第2条・担当ヤリクリ)
# 使い方: governor.sh <slug> <class>
#   class: daily | weekly | monthly | event | cs | heartbeat
# 終了コード: 0=実行してよい / 78=スキップ(GitHub Actionsのneutral相当として扱う)
# しきい値: 80%超 → 非常勤(weekly/monthly/event)をスキップ
#           85%超 → cs / heartbeat 以外を全スキップ(CS予備枠)
set -euo pipefail

SLUG="${1:?usage: governor.sh <slug> <class>}"
CLASS="${2:?class required}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
USAGE="$REPO_ROOT/state/usage.json"

read -r PERCENT MONTH <<<"$(python3 - "$USAGE" <<'PY'
import json, sys, datetime
u = json.load(open(sys.argv[1]))
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m")
if u.get("month") != now:
    print(0, now)  # 月替わり: リセット対象(記録側で処理)
else:
    budget = max(u.get("budget_points", 1000), 1)
    print(round(100 * u.get("spent_points", 0) / budget, 1), now)
PY
)"

echo "[governor] month=$MONTH usage=${PERCENT}% class=$CLASS slug=$SLUG"

DECISION="run"
if python3 -c "exit(0 if $PERCENT > 85 else 1)"; then
  case "$CLASS" in
    cs|heartbeat) DECISION="run" ;;
    *) DECISION="skip-cs-reserve" ;;
  esac
elif python3 -c "exit(0 if $PERCENT > 80 else 1)"; then
  case "$CLASS" in
    weekly|monthly|event) DECISION="skip-eco" ;;
    *) DECISION="run" ;;
  esac
fi

if [ "$DECISION" != "run" ]; then
  REASON="省エネ運転(80%超)"
  [ "$DECISION" = "skip-cs-reserve" ] && REASON="CS予備枠(85%超・一般業務停止)"
  echo "[governor] SKIP: $REASON"
  "$SCRIPT_DIR/discord_post.sh" yarikuri log "⚖️ 使用量ガバナー: ${SLUG} のセッションをスキップしました(${REASON}・使用率${PERCENT}%)" || true
  exit 78
fi
echo "[governor] OK to run"
