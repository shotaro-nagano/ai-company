#!/usr/bin/env python3
"""サポートGmailから返信を送る(マメ専用)。
使い方: gmail_send.py <宛先> <件名> <本文ファイル> [返信元メッセージID]
"""
import base64
import sys
from email.mime.text import MIMEText
from pathlib import Path

import json
import urllib.request

from gmail_poll import get_access_token


def main() -> None:
    to, subject, body_file = sys.argv[1], sys.argv[2], sys.argv[3]
    thread_msg_id = sys.argv[4] if len(sys.argv) > 4 else None
    token = get_access_token()
    if not token:
        print("Gmail認証情報が未設定のため送信できません", file=sys.stderr)
        sys.exit(1)
    mime = MIMEText(Path(body_file).read_text(), _charset="utf-8")
    mime["To"] = to
    mime["Subject"] = subject
    payload = {"raw": base64.urlsafe_b64encode(mime.as_bytes()).decode()}
    if thread_msg_id:
        payload["threadId"] = thread_msg_id
    req = urllib.request.Request(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        print("sent:", json.load(r).get("id"))


if __name__ == "__main__":
    main()
