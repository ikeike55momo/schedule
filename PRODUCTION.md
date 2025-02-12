# 本番環境セットアップ手順

## 1. アプリケーションのビルド

```bash
# プロジェクトディレクトリで実行
npm run build

# ビルド結果は ./dist ディレクトリに生成されます
```

## 2. 静的ファイルのホスティング

生成された`dist`ディレクトリの内容を、Netlifyなどの静的ホスティングサービスにデプロイします。

### Netlifyの場合:

1. Netlifyにサインイン
2. 新しいサイトをデプロイ
3. `dist`ディレクトリをアップロード
4. カスタムドメインを設定(オプション)

## 3. MCPサーバーのセットアップ

### 3.1 Google認証の設定

1. Google Cloud Consoleで認証情報を設定
   - リダイレクトURI: `https://your-domain.com`を追加
   - 承認済みドメインを設定

2. 本番環境用のトークンを取得
```bash
cd /path/to/google-integration-server
npm run get-token:prod
```

3. 環境変数の設定
```json
{
  "GOOGLE_ACCESS_TOKEN": "本番環境のアクセストークン",
  "GOOGLE_REFRESH_TOKEN": "本番環境のリフレッシュトークン",
  "GOOGLE_TOKEN_TYPE": "Bearer",
  "GOOGLE_TOKEN_EXPIRY": "トークンの有効期限",
  "GOOGLE_SCOPE": "必要なスコープ"
}
```

### 3.2 MCPサーバーの起動

1. サーバーをビルド
```bash
cd /path/to/google-integration-server
npm run build
```

2. サーバーを起動
```bash
# PM2などのプロセスマネージャーを使用
pm2 start build/index.js --name google-integration-server
```

## 4. 環境変数の設定

本番環境の`.env`ファイルに必要な設定を追加:

```env
VITE_SUPABASE_URL=本番環境のSupabase URL
VITE_SUPABASE_ANON_KEY=本番環境のSupabase Anon Key
VITE_MCP_SERVER_URL=本番環境のMCPサーバーURL
```

## 5. セキュリティ設定

1. SSL/TLS証明書の設定
2. CORSの設定
3. セキュリティヘッダーの設定
4. レート制限の設定

## 6. 監視とメンテナンス

1. ログ監視の設定
2. パフォーマンス監視
3. エラー通知の設定
4. バックアップの設定

## 7. 定期的なメンテナンス

1. トークンの更新確認
2. セキュリティアップデート
3. 依存パッケージの更新
4. ログのローテーション

## トラブルシューティング

1. ログの確認方法
2. 一般的な問題と解決方法
3. サポート連絡先