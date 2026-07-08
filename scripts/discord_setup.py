#!/usr/bin/env python3
"""建国セットアップ専用: Botトークンで #チャンネル8本 と #Webhook6本 を自動作成する。

前提: Botがサーバーに Manage Channels / Manage Webhooks 権限で参加済みであること。
使い方(あなた自身のターミナルで・トークンは私=Claudeに見せない):
    DISCORD_BOT_TOKEN='<Botトークン>' python3 scripts/discord_setup.py

出力: 作成した6本のWebhook URL(→GitHub Secretsに登録)と、
      #承認待ち/#社長室 のチャンネルID(→私に伝える or 自分で state/discord_channels.json に記入)。
このスクリプトはセットアップ後は不要(シオリの掃除対象)。
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://discord.com/api/v10"

# 作るチャンネル(表示名 → 役割)。Webhookを付ける6本には webhook=True。
CHANNELS = [
    ("承認待ち", "approval", True),
    ("売上通知", "sales", True),
    ("週次レポート", "weekly", True),
    ("経営会議", "meeting", True),
    ("作業ログ", "log", True),
    ("エラー", "error", True),
    ("社長室", "boss", False),
    ("general", "general", False),
]
# Webhook用チャンネル → GitHub Secret名
SECRET_NAME = {
    "approval": "DISCORD_WEBHOOK_APPROVAL",
    "sales": "DISCORD_WEBHOOK_SALES",
    "weekly": "DISCORD_WEBHOOK_WEEKLY",
    "meeting": "DISCORD_WEBHOOK_MEETING",
    "log": "DISCORD_WEBHOOK_LOG",
    "error": "DISCORD_WEBHOOK_ERROR",
}


def req(token, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bot {token}",
            "Content-Type": "application/json",
            "User-Agent": "PixelYen-Setup (v1)",
        },
    )
    for attempt in range(5):
        try:
            with urllib.request.urlopen(r, timeout=20) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code == 429:  # レート制限
                retry = json.loads(e.read()).get("retry_after", 2)
                time.sleep(float(retry) + 0.5)
                continue
            print(f"HTTPエラー {e.code}: {e.read().decode()}", file=sys.stderr)
            raise
    raise SystemExit("レート制限が続いたため中断しました。少し待って再実行してください。")


def main():
    token = os.environ.get("DISCORD_BOT_TOKEN", "")
    if not token:
        sys.exit("環境変数 DISCORD_BOT_TOKEN を付けて実行してください")

    # Botが参加しているサーバーを取得(1つだけの想定)
    guilds = req(token, "GET", "/users/@me/guilds")
    if not guilds:
        sys.exit("Botがどのサーバーにも参加していません。招待手順(Step 7)を先に完了してください。")
    guild = guilds[0]
    guild_id = guild["id"]
    print(f"サーバー「{guild['name']}」(id:{guild_id})にチャンネルを作成します\n")

    existing = {c["name"]: c for c in req(token, "GET", f"/guilds/{guild_id}/channels")}
    channel_ids = {}
    webhook_lines = []

    for display, key, need_webhook in CHANNELS:
        if display in existing:
            ch = existing[display]
            print(f"= 既存: {display}")
        else:
            ch = req(token, "POST", f"/guilds/{guild_id}/channels", {"name": display, "type": 0})
            print(f"+ 作成: {display}")
            time.sleep(0.4)
        channel_ids[key] = ch["id"]

        if need_webhook:
            hooks = req(token, "GET", f"/channels/{ch['id']}/webhooks")
            hook = next((h for h in hooks if h.get("name") == "PixelYen"), None)
            if not hook:
                hook = req(token, "POST", f"/channels/{ch['id']}/webhooks", {"name": "PixelYen"})
                time.sleep(0.4)
            url = f"https://discord.com/api/webhooks/{hook['id']}/{hook['token']}"
            webhook_lines.append((SECRET_NAME[key], url))

    # state/discord_channels.json を更新(承認待ち・社長室のIDはここに書いてよい=秘密ではない)
    ch_file = os.path.join(os.path.dirname(__file__), "..", "state", "discord_channels.json")
    with open(ch_file, "w") as f:
        json.dump(
            {
                "_comment": "チャンネルIDは秘密情報ではない。discord_setup.py が自動記入した",
                "approval": channel_ids.get("approval", ""),
                "boss": channel_ids.get("boss", ""),
            },
            f,
            indent=2,
            ensure_ascii=False,
        )
    print(f"\n✅ state/discord_channels.json を更新しました(承認待ち/社長室のID)")

    print("\n" + "=" * 60)
    print("【GitHub Secrets に登録する6本】")
    print("https://github.com/shotaro-nagano/ai-company/settings/secrets/actions")
    print("を開き、下の Name / Secret のペアを『New repository secret』で1つずつ登録:\n")
    for name, url in webhook_lines:
        print(f"  Name  : {name}")
        print(f"  Secret: {url}\n")
    print("=" * 60)
    print("↑のURL(webhook)は秘密情報です。GitHubに貼ったら、この画面は閉じてください。")


if __name__ == "__main__":
    main()
