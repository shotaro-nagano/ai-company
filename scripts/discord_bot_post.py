#!/usr/bin/env python3
"""Botトークンで任意のチャンネルへ社員として投稿する汎用スクリプト。

Webhook Secret が無いチャンネル(#general など)にも投稿できる:
チャンネルを名前で解決し、Botの「ウェブフックの管理」権限で
Webhook「PixelYen」を自動作成/再利用して username/avatar を出し分ける。

使い方: discord_bot_post.py <チャンネル名> <slug> "<本文>"
例:     discord_bot_post.py general hirome "今日は良い天気ですね"
DISCORD_BOT_TOKEN 未設定なら警告だけ出して正常終了(建国を止めない方針)。
"""
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
API = "https://discord.com/api/v10"


def api(token, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bot {token}",
            "Content-Type": "application/json",
            "User-Agent": "PixelYen (bot-post, v1)",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        raw = r.read()
        # Webhook実行は204 No Content(本文なし)を返す。空ならNoneを返す
        return json.loads(raw) if raw else None


def main() -> None:
    if len(sys.argv) < 4:
        sys.exit("usage: discord_bot_post.py <channel-name> <slug> '<message>'")
    channel_name, slug, message = sys.argv[1], sys.argv[2], sys.argv[3]

    token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
    if not token:
        print(f"(DISCORD_BOT_TOKEN 未設定 — #{channel_name} への投稿をスキップ)", file=sys.stderr)
        print(message, file=sys.stderr)
        return

    guilds = api(token, "GET", "/users/@me/guilds")
    if not guilds:
        sys.exit("Botがサーバーに参加していません")
    channels = api(token, "GET", f"/guilds/{guilds[0]['id']}/channels")
    ch = next((c for c in channels if c.get("name") == channel_name and c.get("type") == 0), None)
    if not ch:
        sys.exit(f"チャンネルが見つかりません: {channel_name}")

    hooks = api(token, "GET", f"/channels/{ch['id']}/webhooks")
    hook = next((h for h in hooks if h.get("name") == "PixelYen" and h.get("token")), None)
    if not hook:
        hook = api(token, "POST", f"/channels/{ch['id']}/webhooks", {"name": "PixelYen"})
        time.sleep(0.3)

    emp = json.loads((REPO / "scripts" / "employees.json").read_text()).get(slug, {})
    username = f"{emp.get('name', slug)}({emp.get('role', '')})" if emp else slug
    avatar = ""
    if os.environ.get("GITHUB_REPOSITORY"):
        avatar = f"https://raw.githubusercontent.com/{os.environ['GITHUB_REPOSITORY']}/main/assets/discord/{slug}.png"

    for i in range(0, len(message), 1900):
        payload = {"username": username, "content": message[i : i + 1900]}
        if avatar:
            payload["avatar_url"] = avatar
        api(token, "POST", f"/webhooks/{hook['id']}/{hook['token']}", payload)
    print(f"[bot_post] #{channel_name} へ投稿しました")


if __name__ == "__main__":
    main()
