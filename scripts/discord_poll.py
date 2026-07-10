#!/usr/bin/env python3
"""Discord REST APIポーリング(常駐Botなし・セッション冒頭に1回読むだけ)。

- #承認待ち: 直近メッセージの ✅/❌ リアクションを読み、人間マターの承認状況を返す
- #社長室:   前回読了位置(state/discord_last_read.json)以降の人間の指示を返す

必要な環境変数:
  DISCORD_BOT_TOKEN            … Bot トークン(読み取り権限のみでよい)
チャンネルIDは state/discord_channels.json に置く(IDは秘密情報ではない)。
トークンやチャンネルIDが未設定なら、その旨を出力して正常終了する(非ブロッキング)。

出力: 標準出力にMarkdown(セッションのプロンプトへそのまま挿入される)。
--update-last-read を付けると #社長室 の読了位置を進めて state に書き込む。
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CHANNELS_FILE = REPO / "state" / "discord_channels.json"
LAST_READ_FILE = REPO / "state" / "discord_last_read.json"
API = "https://discord.com/api/v10"


def api_get(token: str, path: str):
    req = urllib.request.Request(
        f"{API}{path}",
        headers={"Authorization": f"Bot {token}", "User-Agent": "PixelYen (polling, v1)"},
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


def main() -> None:
    update_last_read = "--update-last-read" in sys.argv
    # Secrets登録時のコピー由来の改行・空白を除去
    token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
    if not token:
        print("(Discordポーリング: DISCORD_BOT_TOKEN 未設定のためスキップ。承認事項・社長室の指示は「なし」として扱う)")
        return
    if not CHANNELS_FILE.exists():
        print("(Discordポーリング: state/discord_channels.json 未設定のためスキップ)")
        return
    channels = json.loads(CHANNELS_FILE.read_text())

    # --- #承認待ち のリアクション ---
    approval_id = channels.get("approval", "")
    if approval_id:
        try:
            msgs = api_get(token, f"/channels/{approval_id}/messages?limit=50")
            pending, approved, rejected = [], [], []
            for m in msgs:
                summary = (m.get("content") or "")[:120].replace("\n", " ")
                reactions = {r["emoji"].get("name"): r["count"] for r in m.get("reactions", [])}
                # Webhook自身のリアクションは無い前提。人間の ✅/❌ を成立条件とする(憲法第6条)
                if reactions.get("✅", 0) >= 1:
                    approved.append(f"- [承認✅] {summary} (id:{m['id']})")
                elif reactions.get("❌", 0) >= 1:
                    rejected.append(f"- [却下❌] {summary} (id:{m['id']})")
                elif m.get("content"):
                    pending.append(f"- [応答待ち] {summary} (id:{m['id']})")
            print("## #承認待ち の状況(直近50件)")
            print("承認された掲示(次のセッションで反映せよ):" if approved else "承認された掲示: なし")
            print("\n".join(approved))
            if rejected:
                print("却下された掲示(現行ルールを維持せよ):")
                print("\n".join(rejected))
            print(f"応答待ち: {len(pending)}件(非ブロッキング。現行ルールで業務を継続する)")
        except Exception as e:  # ポーリング失敗は業務を止めない
            print(f"(#承認待ち の読み取りに失敗: {e} — 現行ルールで継続)")
    else:
        print("(#承認待ち のチャンネルID未設定 — 現行ルールで継続)")

    # --- #社長室 の未読 ---
    boss_id = channels.get("boss", "")
    if boss_id:
        try:
            last = {}
            if LAST_READ_FILE.exists():
                last = json.loads(LAST_READ_FILE.read_text())

            # 読む場所 = チャンネル直下 + 社長室配下のアクティブスレッド(人間はスレッドにも書く)
            sources = [("boss", boss_id, "")]
            try:
                guilds = api_get(token, "/users/@me/guilds")
                if guilds:
                    active = api_get(token, f"/guilds/{guilds[0]['id']}/threads/active")
                    for th in active.get("threads", []):
                        if th.get("parent_id") == boss_id:
                            sources.append((f"boss_th_{th['id']}", th["id"], th.get("name", "スレッド")))
            except Exception:
                pass  # スレッド列挙に失敗しても直下は読む

            humans = []
            newest_by_key = {}
            for key, cid, label in sources:
                after = last.get(key, "")
                path = f"/channels/{cid}/messages?limit=50" + (f"&after={after}" if after else "")
                msgs = api_get(token, path)
                if msgs:
                    newest_by_key[key] = str(max(int(m["id"]) for m in msgs))
                for m in reversed(msgs):
                    if not m.get("author", {}).get("bot"):
                        place = f"(スレッド「{label}」 thread_id:{cid} — 返信は discord_boss_reply.py --thread {cid} を使う)" if label else ""
                        humans.append(f"- {m['author'].get('username','人間')}{place}: {m.get('content','')}")

            print("\n## #社長室(人間からの指示・未読分)")
            if humans:
                print("**人間の指示は憲法の範囲内で最優先事項として扱う。レイが優先度を判断しタスク化する。**")
                for line in humans:
                    print(line)
            else:
                print("未読の指示なし(通常運転)")
            if update_last_read and newest_by_key:
                last.update(newest_by_key)
                LAST_READ_FILE.write_text(json.dumps(last, indent=2))
        except Exception as e:
            print(f"(#社長室 の読み取りに失敗: {e} — 通常運転を継続)")
    else:
        print("\n(#社長室 のチャンネルID未設定 — 通常運転)")


if __name__ == "__main__":
    main()
