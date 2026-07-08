#!/usr/bin/env python3
"""サポートGmailの未読を読む(マメのCSセッション用)。

必要な環境変数: GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_OAUTH_REFRESH_TOKEN
未設定なら「保留」と出力して正常終了(建国を止めない)。
返信は同トークンで scripts/gmail_send.py を使う。
注意: 顧客の個人情報はリポジトリに書かない(憲法第10条)。要約・匿名化のみ。
"""
import base64
import json
import os
import urllib.parse
import urllib.request


def get_access_token() -> str | None:
    cid = os.environ.get("GMAIL_CLIENT_ID", "")
    secret = os.environ.get("GMAIL_CLIENT_SECRET", "")
    refresh = os.environ.get("GMAIL_OAUTH_REFRESH_TOKEN", "")
    if not (cid and secret and refresh):
        return None
    data = urllib.parse.urlencode(
        {
            "client_id": cid,
            "client_secret": secret,
            "refresh_token": refresh,
            "grant_type": "refresh_token",
        }
    ).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)["access_token"]


def api_get(token: str, path: str):
    req = urllib.request.Request(
        f"https://gmail.googleapis.com/gmail/v1/users/me{path}",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def main() -> None:
    token = get_access_token()
    if not token:
        print("(Gmailポーリング: 認証情報未設定 — サポート受信箱は保留中)")
        return
    res = api_get(token, "/messages?q=is:unread%20in:inbox&maxResults=10")
    ids = [m["id"] for m in res.get("messages", [])]
    if not ids:
        print("(サポート受信箱: 未読なし)")
        return
    print(f"## サポート未読メール({len(ids)}件)")
    for mid in ids:
        msg = api_get(token, f"/messages/{mid}?format=metadata&metadataHeaders=Subject&metadataHeaders=From")
        headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
        print(f"- id:{mid} | From: {headers.get('From','?')} | 件名: {headers.get('Subject','(無題)')}")
        print(f"  概要: {msg.get('snippet','')[:200]}")
    print("\n(本文の確認・返信は scripts/gmail_send.py を使用。定型返金は14日全額のみ・例外対応禁止)")


if __name__ == "__main__":
    main()
