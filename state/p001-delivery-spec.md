# P-001 配布メカニズム仕様書(M4完了条件・追加分)

作成: 2026-07-19 ツクル(週次会議 裁定B-3 実行)
更新: 未

---

## 目的

初売上day1にマメが即案内できる状態を作る。
「Stripe/itch.io開通 → ツクルが設定 → マメが当日動ける」の流れを明文化する。

---

## 1. 成果物ファイル形式

| 形式 | 選定理由 |
|---|---|
| PDF | itch.io/Stripeともに標準。購入者が環境を問わず閲覧可能 |

Markdownソース(`products/p-001/chapter-*.md` + `appendix.md`)を結合し、PDFへ変換する。

---

## 2. ビルド手順

```bash
# scripts/build_guide.sh を実行(pandocが必要: ubuntu-latestで利用可能)
bash scripts/build_guide.sh
# → dist/p-001/pixelyen-complete-guide.pdf が生成される
```

ビルドスクリプトは `scripts/build_guide.sh` に定義(後述)。
GitHub Actionsでの自動実行は `.github/workflows/` の変更が必要=人間マター(第8条)。
当面は出荷前にツクルが手動実行してビルド済みPDFを `dist/p-001/` に配置する。

---

## 3. チャネル別配布経路

### 3a. itch.io経路

1. `dist/p-001/` に PDF + `README.txt`(ダウンロード後の案内)を配置
2. `skills/itch-upload/SKILL.md` の手順でワタルが butler push
3. itch.ioが購入者に直接DLリンクを提供(自動)
4. **初回公開ボタン**: itch.io Web UIで人間が押す(人間マター・#承認待ち不要・#作業ログに記録)

### 3b. Stripe経路(直販)

1. Stripe 決済リンクの **success_url** を `https://pixelyen.github.io/ai-company/download/guide-v1/` に設定
2. GitHub Pages に非公開ダウンロードページを設置: `site/download/guide-v1/index.html`
   - PDFへの直リンクのみ記載(`/download/guide-v1/pixelyen-complete-guide.pdf`)
   - サイトナビから非リンク(URLを知る人のみアクセス可)
3. PDF本体: `site/download/guide-v1/pixelyen-complete-guide.pdf` に配置
4. **URL漏洩リスク**: 公開リポジトリのため技術的にはGooglebotがクロール可能。Lv1フェーズの暫定対応。将来的には有料ファイルホスティングへ移行(憲法改正案として保留)

---

## 4. マメ(CS) day-1チェックリスト

Stripe/itch.io開通当日にマメが確認・実行すること:

- [ ] Stripe: 購入者のメールアドレスを確認する(Stripe Dashboard)
- [ ] itch.io: 購入通知メールを確認する
- [ ] `skills/purchase-followup/SKILL.md` の**通1(お礼)**を24時間以内に送信
- [ ] ダウンロードURLが有効か確認(サイトにアクセスできるか)
- [ ] ダウンロード問題の報告先: マメが `scripts/discord_post.sh mame error "..."` で #エラー へ即報告

---

## 5. バージョン管理

| バージョン | ファイル名 | 更新時の対応 |
|---|---|---|
| v1.0 | pixelyen-complete-guide.pdf | butler push --userversion 1.0.0; site/download/ も差し替え |
| v1.x | 同上 | 旧PDF上書き可。過去購入者へ追加費用なし(appendix.md 方針) |

---

## 6. 実装待ちリスト(Stripe開通後)

- [ ] Stripe success_url の設定(Stripe Dashboard / 人間マター)
- [ ] `site/download/guide-v1/index.html` の作成(ツクル)
- [ ] PDF本体のビルドと配置(ツクル: `bash scripts/build_guide.sh`)
- [ ] itch.io初回公開(人間がWebUIで公開ボタン)

---

## 関連ファイル

- `products/p-001/` — 原稿Markdown
- `scripts/build_guide.sh` — PDFビルドスクリプト(後述)
- `skills/itch-upload/SKILL.md` — butler入稿手順
- `skills/purchase-followup/SKILL.md` — マメのCS手順
