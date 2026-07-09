#!/usr/bin/env python3
"""state/ から site/data/dashboard.json を生成する(Pagesデプロイ時に実行)。

経営ダッシュボード=ゲームのステータス画面(BRAND.md):
  HP  = 今月の予算カバー率(売上 ÷ 固定費)
  EXP = 累計売上(次のレベルまでのゲージ)
  Lv  = 成長ロードマップの現在段階(VISION.md Lv1〜)
  パーティ = 今週稼働した社員(usage.json のセッション履歴から)
"""
import datetime
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "site" / "data" / "dashboard.json"

LEVEL_THRESHOLDS = [  # (Lv, 到達条件の月商/純利益。ダッシュボード表示用の簡易判定)
    (1, 0),
    (2, 10_000),
    (3, 30_000),
]


def yen(text: str) -> int:
    return int(text.replace(",", "").replace("¥", "").replace("-", "-") or 0)


def main() -> None:
    kpi = (REPO / "state" / "kpi.md").read_text()

    # kpi.md の月次テーブルの最終行(今月)を拾う
    rows = re.findall(r"\|\s*(\d{4}-\d{2})\s*\|\s*¥([\d,-]+)\s*\|\s*¥([\d,-]+)\s*\|", kpi)
    month, revenue, cost = ("—", 0, 15000)
    if rows:
        month, rev_s, cost_s = rows[-1]
        revenue, cost = yen(rev_s), yen(cost_s)

    m = re.search(r"累計売上(?:\(EXP\))?[::]\s*\*{0,2}¥([\d,]+)", kpi)
    total_revenue = yen(m.group(1)) if m else 0

    m = re.search(r"現在のLv[::]\s*\*{0,2}(\d+)", kpi)
    level = int(m.group(1)) if m else 1

    hp = min(100, round(100 * revenue / max(cost, 1)))
    # EXPゲージ: 現Lvの条件→次Lv条件の間での進捗
    next_goal = 10_000 if level == 1 else 30_000 if level == 2 else 100_000
    exp_pct = min(100, round(100 * revenue / next_goal))

    # 今週稼働した社員(usage.json の直近7日)+ 社員別の直近稼働(オフィス演出用)
    usage = json.loads((REPO / "state" / "usage.json").read_text())
    now = datetime.datetime.now(datetime.timezone.utc)
    week_ago = now - datetime.timedelta(days=7)
    day_ago = now - datetime.timedelta(hours=24)
    party = []
    activity = {}  # slug -> {last_at, sessions_7d, active_24h}
    for s in usage.get("sessions", []):
        try:
            at = datetime.datetime.fromisoformat(s["at"])
        except (KeyError, ValueError):
            continue
        slug = s.get("slug", "")
        a = activity.setdefault(slug, {"last_at": None, "sessions_7d": 0, "active_24h": False})
        if a["last_at"] is None or s["at"] > a["last_at"]:
            a["last_at"] = s["at"]
        if at >= week_ago:
            a["sessions_7d"] += 1
            if slug not in party:
                party.append(slug)
        if at >= day_ago:
            a["active_24h"] = True

    employees = json.loads((REPO / "scripts" / "employees.json").read_text())

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                "month": month,
                "revenue_this_month": revenue,
                "cost_this_month": cost,
                "profit_this_month": revenue - cost,
                "total_revenue": total_revenue,
                "level": level,
                "next_level_goal": next_goal,
                "hp_percent": hp,
                "exp_percent": exp_pct,
                "party": party,
                "activity": activity,
                "usage_percent": round(
                    100 * usage.get("spent_points", 0) / max(usage.get("budget_points", 1000), 1), 1
                ),
                "employees": employees,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )
    print(f"[build_dashboard] wrote {OUT}")


if __name__ == "__main__":
    main()
