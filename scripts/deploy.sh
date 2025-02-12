#!/bin/bash

# エラーが発生したら即座に終了
set -e

echo "🚀 本番環境へのデプロイを開始します..."

# 現在のディレクトリを保存
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

# プロジェクトルートに移動
cd "$PROJECT_ROOT"

echo "📦 依存パッケージをインストール中..."
npm install

echo "🔨 アプリケーションをビルド中..."
npm run build

echo "🔍 ビルド結果を確認中..."
if [ ! -d "dist" ]; then
  echo "❌ ビルドに失敗しました: distディレクトリが見つかりません"
  exit 1
fi

# MCPサーバーのビルドと起動
echo "⚙️ MCPサーバーをビルド中..."
cd ../Documents/Cline/MCP/google-integration-server
npm install
npm run build

# PM2が存在するか確認
if ! command -v pm2 &> /dev/null; then
  echo "📥 PM2をインストール中..."
  npm install -g pm2
fi

echo "🚦 MCPサーバーを再起動中..."
pm2 delete google-integration-server || true
pm2 start build/index.js --name google-integration-server

echo "✨ デプロイが完了しました"
echo "
次のステップ:
1. Netlifyにdistディレクトリをアップロード
2. 環境変数を設定
3. DNSレコードを更新(必要な場合)

詳細な手順は PRODUCTION.md を参照してください。
"