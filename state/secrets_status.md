# state/secrets_status.md — 認証情報の健全性台帳(マモルが週次で更新)

**値は絶対にここに書かない。** 登録日・失効予測・状態のみを管理する。
失効30日前になったらマモルが #承認待ち に再発行依頼を掲示する(憲法第3条🟡)。

| Secret名 | 状態 | 登録日 | 失効予測 | 備考 |
|---|---|---|---|---|
| CLAUDE_CODE_OAUTH_TOKEN | 未登録 | — | 登録日+1年 | `claude setup-token` で発行 |
| DISCORD_WEBHOOK_APPROVAL | 未登録 | — | 無期限(削除されない限り) | |
| DISCORD_WEBHOOK_SALES | 未登録 | — | 無期限 | |
| DISCORD_WEBHOOK_WEEKLY | 未登録 | — | 無期限 | |
| DISCORD_WEBHOOK_MEETING | 未登録 | — | 無期限 | |
| DISCORD_WEBHOOK_LOG | 未登録 | — | 無期限 | |
| DISCORD_WEBHOOK_ERROR | 未登録 | — | 無期限 | |
| DISCORD_BOT_TOKEN | 未登録 | — | 無期限(リセットで失効) | |
| STRIPE_API_KEY | 未登録(審査待ち) | — | 無期限 | 審査通過後に人間が登録 |
| ITCH_API_KEY | 未登録(後回し) | — | 無期限 | 商品完成が近づいたら案内 |
| GMAIL_CLIENT_ID / SECRET / REFRESH_TOKEN | 未登録(後回し) | — | リフレッシュトークンは長期 | サポートGmail開設後 |
