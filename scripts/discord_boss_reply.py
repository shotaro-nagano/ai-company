#!/usr/bin/env python3
"""#社長室 へ社員(既定: レイ)として返信する。

Webhookが未整備でも、Botの「ウェブフックの管理」権限で #社長室 にWebhookを
自動作成(既存の「PixelYen」を再利用)して投稿する。新しいSecretは不要。

使い方: discord_boss_reply.py [--slug rei] "<返信本文>"
必要: DISCORD_BOT_TOKEN / state/discord_channels.json の boss ID
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
API = "https://discord.com/api/v10"


def api(token: str, method: str, path: str, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bot {token}",
            "Content-Type": "application/json",
            "User-Agent": "PixelYen (boss-reply, v1)",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        raw = r.read()
        # Webhook実行は204 No Content(本文なし)を返す。空ならNoneを返す
        return json.loads(raw) if raw else None


def main() -> None:
    args = sys.argv[1:]
    slug = "rei"
    if args and args[0] == "--slug":
        slug = args[1]
        args = args[2:]
    message = args[0] if args else ""
    if not message:
        sys.exit("usage: discord_boss_reply.py [--slug rei] '<message>'")

    token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
    if not token:
        print("(DISCORD_BOT_TOKEN 未設定 — 社長室への返信をスキップ)", file=sys.stderr)
        return
    channels = json.loads((REPO / "state" / "discord_channels.json").read_text())
    boss_id = channels.get("boss", "")
    if not boss_id:
        print("(社長室のチャンネルID未設定 — 返信をスキップ)", file=sys.stderr)
        return

    # 既存Webhook「PixelYen」を再利用、無ければ作成(Manage Webhooks権限)
    hooks = api(token, "GET", f"/channels/{boss_id}/webhooks")
    hook = next((h for h in hooks if h.get("name") == "PixelYen" and h.get("token")), None)
    if not hook:
        hook = api(token, "POST", f"/channels/{boss_id}/webhooks", {"name": "PixelYen"})

    emp = json.loads((REPO / "scripts" / "employees.json").read_text()).get(slug, {})
    username = f"{emp.get('name', slug)}({emp.get('role', '')})"
    avatar = ""
    if os.environ.get("GITHUB_REPOSITORY"):
        avatar = f"https://raw.githubusercontent.com/{os.environ['GITHUB_REPOSITORY']}/main/assets/discord/{slug}.png"

    for i in range(0, len(message), 1900):
        payload = {"username": username, "content": message[i : i + 1900]}
        if avatar:
            payload["avatar_url"] = avatar
        api(token, "POST", f"/webhooks/{hook['id']}/{hook['token']}", payload)
    print("[boss_reply] sent")


if __name__ == "__main__":
    main()
