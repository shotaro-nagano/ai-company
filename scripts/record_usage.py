#!/usr/bin/env python3
"""セッション実行後に state/usage.json へ消費ポイントを記録する。
使い方: record_usage.py <slug> <model>
月が替わっていたら自動でリセットする。
"""
import datetime
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
USAGE = REPO / "state" / "usage.json"


def main() -> None:
    slug, model = sys.argv[1], sys.argv[2]
    u = json.loads(USAGE.read_text())
    month = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m")
    if u.get("month") != month:
        u["month"] = month
        u["spent_points"] = 0
        u["sessions"] = []
    points = u.get("weights", {}).get(model, 5)
    u["spent_points"] = u.get("spent_points", 0) + points
    u.setdefault("sessions", []).append(
        {
            "at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "slug": slug,
            "model": model,
            "points": points,
        }
    )
    # 履歴の肥大化防止: 直近200件だけ保持(古い分はシオリが週次で確認済みの前提)
    u["sessions"] = u["sessions"][-200:]
    USAGE.write_text(json.dumps(u, ensure_ascii=False, indent=2) + "\n")
    pct = round(100 * u["spent_points"] / max(u.get("budget_points", 1000), 1), 1)
    print(f"[record_usage] {slug} ({model}) +{points}pt → {u['spent_points']}pt ({pct}%)")


if __name__ == "__main__":
    main()
