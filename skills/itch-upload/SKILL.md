---
name: itch-upload
description: itch.io への butler CLI 入稿手順(ワタル専用。英語ストア運用)
---

# itch.io 入稿手順(butler CLI)

前提: 環境変数 `BUTLER_API_KEY`(= Secret ITCH_API_KEY)。未設定なら「保留」と報告して終了。

## 手順

1. butler の取得(セッション内で毎回。無料・公式):
   ```bash
   curl -L -o butler.zip https://broth.itch.zone/butler/linux-amd64/LATEST/archive/default
   unzip -o butler.zip && chmod +x butler
   ./butler version
   ```
2. 商品ディレクトリを準備(例: `dist/guide-en/` に PDF/EPUB とREADME)
3. 入稿(チャンネル名は `pdf` `epub` など内容で分ける):
   ```bash
   BUTLER_API_KEY=$ITCH_API_KEY ./butler push dist/guide-en pixelyen/complete-guide:pdf
   ```
4. ストアページの説明文は英語。**収益保証表現は英語でも禁止**(第3条)。"A field manual for replicating an AI-run company" のような事実ベースの表現を使う
5. 価格設定・公開状態の変更はitch.ioのAPI外(Web UI)のため、初回公開時のみ #承認待ち ではなく #作業ログ に「人間がWeb UIで公開ボタンを押す必要がある」と記録し、handoff.mdでマトメ経由の要約に載せる

## 更新時

同じ `butler push` で差分アップロードされる。バージョンは `--userversion <semver>` を付ける。
