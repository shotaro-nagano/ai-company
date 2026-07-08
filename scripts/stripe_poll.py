#!/usr/bin/env python3
"""Stripe売上ポーリング: 新規売上を検出して #売上通知 へ即ポストし、要約を標準出力へ返す。

- STRIPE_API_KEY 未設定なら「保留」と出力して正常終了(建国を止めない)
- 前回ポーリング時刻は state/stripe_last_poll.json に保存
- kpi.md の数値更新はセッション(担当社員)が本スクリプトの出力を見て行う
"""
import json
import os
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LAST_POLL_FILE = REPO / "state" / "stripe_last_poll.json"


def main() -> None:
    key = os.environ.get("STRIPE_API_KEY", "")
    if not key:
        print("(Stripeポーリング: STRIPE_API_KEY 未設定 — 審査通過・登録までこの機能は保留)")
        return

    since = 0
    if LAST_POLL_FILE.exists():
        since = json.loads(LAST_POLL_FILE.read_text()).get("last_poll_epoch", 0)
    if since == 0:
        since = int(time.time()) - 86400  # 初回は直近24時間

    params = urllib.parse.urlencode({"limit": 100, "created[gt]": since})
    req = urllib.request.Request(
        f"https://api.stripe.com/v1/charges?{params}",
        headers={"Authorization": f"Bearer {key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.load(r)
    except Exception as e:
        print(f"(Stripeポーリング失敗: {e} — 次回セッションで再試行)")
        return

    new_sales = [c for c in data.get("data", []) if c.get("paid") and not c.get("refunded")]
    if new_sales:
        total = 0
        lines = []
        for c in new_sales:
            amount = c["amount"]  # JPYは最小単位=円
            currency = c["currency"].upper()
            desc = c.get("description") or c.get("calculated_statement_descriptor") or "商品"
            lines.append(f"💰 新規売上: {desc} — {amount:,} {currency}")
            if currency == "JPY":
                total += amount
        message = "\n".join(lines) + f"\n(今回検出 {len(new_sales)} 件)"
        subprocess.run(
            [str(REPO / "scripts" / "discord_post.sh"), "kazoe", "sales", message],
            check=False,
        )
        print("## Stripe新規売上(kpi.md に反映せよ)")
        print(message)
        print(f"JPY合計: ¥{total:,}")
    else:
        print("(Stripe: 新規売上なし)")

    LAST_POLL_FILE.write_text(json.dumps({"last_poll_epoch": int(time.time())}, indent=2))


if __name__ == "__main__":
    main()
