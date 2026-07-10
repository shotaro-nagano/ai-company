#!/usr/bin/env python3
"""一時診断: Botが見えている全ギルド/全チャンネル/全スレッドと、人間の直近発言の所在を出力する。
問題解決後は削除してよい(シオリの掃除対象)。個人情報保護のため本文は先頭20字のみ。
"""
import json
import os
import urllib.request

API = "https://discord.com/api/v10"
TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "").strip()


def get(path):
    req = urllib.request.Request(
        f"{API}{path}",
        headers={"Authorization": f"Bot {TOKEN}", "User-Agent": "PixelYen (debug, v1)"},
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


def main():
    if not TOKEN:
        print("no token")
        return
    for g in get("/users/@me/guilds"):
        print(f"■ ギルド: {g['name']} (id:{g['id']})")
        try:
            chans = get(f"/guilds/{g['id']}/channels")
        except Exception as e:
            print(f"  チャンネル一覧不可: {e}")
            continue
        for c in chans:
            if c.get("type") != 0:
                continue
            line = f"  # {c['name']} (id:{c['id']})"
            try:
                msgs = get(f"/channels/{c['id']}/messages?limit=5")
                hums = [m for m in msgs if not m.get("author", {}).get("bot")]
                if hums:
                    m = hums[0]
                    line += f" | 人間の直近発言: {m['author'].get('username')}「{(m.get('content') or '')[:20]}」"
                ths = [m["thread"]["name"] for m in msgs if m.get("thread")]
                if ths:
                    line += f" | メッセージ付随スレッド: {ths}"
            except Exception as e:
                line += f" | 読み取り不可: {type(e).__name__}"
            print(line)
        try:
            act = get(f"/guilds/{g['id']}/threads/active").get("threads", [])
            print(f"  ▶ ギルド全体のアクティブスレッド: {len(act)}件")
            for t in act[:10]:
                print(f"    - 「{t.get('name')}」 id:{t['id']} parent:{t.get('parent_id')} type:{t.get('type')}")
        except Exception as e:
            print(f"  ▶ アクティブスレッド一覧不可: {e}")


if __name__ == "__main__":
    main()
