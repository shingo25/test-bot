# Binance DCA Bot（ドルコスト平均法自動売買ボット）

Binance APIを使用した包括的なビットコインドルコスト平均法（DCA）自動売買ボットです。美しいReactフロントエンドと堅牢なNode.jsバックエンドにより、定期的な自動ビットコイン購入を設定できます。

## 🚀 機能

### ✅ フェーズ1（完了 - ローカル開発）
- **APIキー管理**: Binance API認証情報の安全な暗号化保存
- **DCA戦略設定**: 購入金額と間隔の設定（15分〜24時間）
- **自動ビットコイン購入**: node-cronによるバックグラウンド実行
- **リアルタイムボット制御**: ライブステータス監視でのボット開始/停止
- **購入履歴**: 統計付きの詳細取引履歴
- **ローカルセキュリティ**: APIキーのAES-256暗号化、SQLiteデータベース
- **美しいUI**: リアルタイム更新対応のモダンなReactインターフェース

### ✅ フェーズ2（完了 - 本番環境対応）
- **JWT認証**: マルチユーザー認証システム
- **PostgreSQLサポート**: SQLiteフォールバック付きの本番グレードデータベース
- **Dockerコンテナ化**: フルスタックDocker Composeデプロイメント
- **本番セキュリティ**: Nginxリバースプロキシ、SSL/TLS、レート制限
- **データベース抽象化**: SQLite/PostgreSQL間のシームレス切り替え
- **環境検証**: 自動セキュリティ設定チェック
- **ヘルスモニタリング**: 包括的なヘルスチェックとログ機能

## 📁 プロジェクト構造

```
test-bot/
├── backend/                      # Node.js + Express APIサーバー
│   ├── src/
│   │   ├── server.ts            # メインサーバーエントリーポイント
│   │   ├── routes.ts            # APIエンドポイント
│   │   ├── authRoutes.ts        # 認証エンドポイント
│   │   ├── auth.ts              # JWT認証サービス
│   │   ├── database/            # データベース抽象化レイヤー
│   │   │   ├── connection.ts    # データベース接続インターフェース
│   │   │   ├── factory.ts       # データベースファクトリーパターン
│   │   │   └── queries.ts       # SQLクエリ
│   │   ├── dcaEngine.ts         # DCA自動化エンジン
│   │   ├── binanceService.ts    # Binance API統合
│   │   ├── encryption.ts        # APIキー暗号化サービス
│   │   ├── security.ts          # セキュリティミドルウェア
│   │   └── logger.ts            # ログサービス
│   ├── data/                    # SQLiteデータベースストレージ
│   ├── package.json
│   └── tsconfig.json
├── frontend/                    # React + TypeScript UI
│   ├── src/
│   │   ├── components/          # Reactコンポーネント
│   │   │   ├── ApiKeySetup.tsx  # APIキー設定
│   │   │   ├── DCASettings.tsx  # DCA設定
│   │   │   ├── BotControl.tsx   # ボット制御
│   │   │   └── PurchaseHistory.tsx # 購入履歴
│   │   ├── api/                # APIクライアント
│   │   ├── App.tsx             # メインアプリケーション
│   │   └── App.css             # スタイリング
│   └── package.json
├── nginx/                       # Nginx設定
│   ├── nginx.conf              # 本番Nginx設定
│   └── ssl/                    # SSL証明書
├── scripts/                     # デプロイメントとユーティリティスクリプト
│   ├── deploy.sh               # 本番デプロイメントスクリプト
│   ├── validate-env.sh         # 環境変数検証
│   ├── backup.sh               # データベースバックアップスクリプト
│   ├── init.sql                # PostgreSQL初期化
│   └── start-postgres.sh       # ローカルPostgreSQL設定
├── docker-compose.yml           # Dockerサービス設定
├── Dockerfile                   # マルチステージDockerビルド
├── .env.example                # 環境変数テンプレート
├── .env.production             # 本番環境テンプレート
├── DOCKER_DEPLOYMENT.md        # 詳細デプロイガイド
└── README.md
```

## 🛠️ インストールとセットアップ

### 前提条件
- **ローカル開発**: Node.js (v18+)、npm/yarn、Binanceアカウント
- **本番デプロイメント**: Docker、Docker Compose、Git
- **サーバー**: Docker対応のVPS/クラウドサーバー

## 🚀 クイックスタート（本番デプロイメント）

### 1. リポジトリのクローン
```bash
git clone https://github.com/shingo25/test-bot.git
cd test-bot
```

### 2. 環境設定
```bash
# 環境変数テンプレートをコピー
cp .env.example .env

# セキュアな値で編集
nano .env
```

### 3. 設定の検証
```bash
# 環境設定をチェック
./scripts/validate-env.sh
```

### 4. Dockerでデプロイ
```bash
# フルスタックデプロイ
./scripts/deploy.sh
```

DCAボットにアクセス: **https://your-server-ip**

---

## 💻 ローカル開発セットアップ

### 1. 依存関係のインストール
```bash
# バックエンド
cd backend && npm install

# フロントエンド  
cd ../frontend && npm install
```

### 2. 環境設定
```bash
# バックエンド環境
cd backend
cp .env.example .env
# 開発用の値で.envを編集
```

### 3. 開発サーバーの起動
```bash
# ターミナル1 - バックエンド
cd backend && npm run dev

# ターミナル2 - フロントエンド
cd frontend && npm start
```

**開発用URL:**
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001
- ヘルスチェック: http://localhost:3001/health

## 🔧 設定

### 1. APIキーセットアップ
1. Binanceでスポット取引権限付きAPIキーを作成
2. **テスト用: Binance TestnetのAPIキーを使用**
3. アプリで「API設定」タブに移動
4. APIキーとシークレットを入力
5. 接続テストで確認

### 2. DCA戦略設定
1. 「DCA設定」タブに移動
2. 購入金額を設定（最小10 USDT）
3. 購入間隔を選択（15分〜24時間）
4. 設定を保存

### 3. ボット制御
1. 「ボット制御」タブに移動
2. 設定を確認
3. 「ボット開始」をクリックして自動化開始
4. ステータスと次回実行時刻を監視

## 📊 APIエンドポイント

### 設定
- `POST /api/settings/apikey` - 暗号化APIキーの保存
- `GET /api/settings` - 現在の設定取得
- `PUT /api/settings` - DCA設定の更新
- `POST /api/test-connection` - Binance API接続テスト

### ボット制御
- `POST /api/bot/start` - DCAボット開始
- `POST /api/bot/stop` - DCAボット停止
- `GET /api/bot/status` - ボットステータス取得

### 履歴と統計
- `GET /api/history` - 購入履歴取得
- `GET /api/statistics` - 取引統計取得

## 🔒 セキュリティ機能

### フェーズ1（ローカル）
- **APIキー暗号化**: 保存認証情報のAES-256暗号化
- **ローカルストレージ**: 全データをローカルマシンに保持
- **外部送信なし**: APIキーがローカル環境から外部に送信されない
- **セキュアデータベース**: 機密データ暗号化付きSQLite

### フェーズ2（サーバーデプロイメント）
- JWT認証
- HTTPS強制
- 強化されたデータベース暗号化
- セッション管理
- レート制限

## 📈 DCA戦略のメリット

- **ボラティリティ平滑化**: 定期購入により価格変動の影響を軽減
- **感情に左右されない投資**: 自動実行により感情的な判断を排除
- **コスト平均化**: 時間をかけて平均取得コストを下げる可能性
- **規律ある投資**: 一貫した投資アプローチの構築

## ⚠️ 重要な注意事項

### テスト用
- **初回テストは必ずBinance Testnetを使用**
- 実APIキー使用時は少額から開始
- 初回実行時はボットを注意深く監視

### API要件
- 最小注文: 10 USDT（Binance要件）
- APIキーはスポット取引権限のみ必要
- レート制限: Binance API制限を遵守

### データストレージ
- データベース: `backend/data/dca_bot.db`
- ログ: コンソール出力（フェーズ1）
- バックアップ: 購入履歴のCSVエクスポート

## 🚦 開発ステータス

- ✅ **フェーズ1**: ローカル開発とテスト - **完了**
- ✅ **フェーズ2**: 本番デプロイメント対応 - **完了**
- 🎯 **本番環境準備完了**: PostgreSQL付きフルDockerスタック

## 🌐 本番デプロイメント

### サーバー要件
- **VPS/クラウドサーバー**: RAM 2GB以上、ストレージ20GB以上
- **オペレーティングシステム**: Ubuntu 20.04以上または同等のLinux
- **サービス**: Docker、Docker Compose
- **ドメイン**（オプション): 適切なSSL証明書付きHTTPS用

### 環境変数
`.env`で設定する重要な変数:
```bash
# セキュリティ（必須）
JWT_SECRET=暗号学的に安全な32文字以上のシークレット
ENCRYPTION_KEY=正確に32文字の暗号化キー

# データベース（必須）  
DB_PASSWORD=強力なデータベースパスワード
REDIS_PASSWORD=強力なRedisパスワード

# アプリケーション
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### SSL証明書セットアップ
```bash
# 開発用（自己署名）
# デプロイスクリプトによって自動生成

# 本番用（Let's Encrypt）
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/server.crt
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/server.key
```

### モニタリングとメンテナンス
```bash
# アプリケーションログ表示
docker-compose logs -f dca-bot

# リソース使用量監視
docker stats

# データベースバックアップ
./scripts/backup.sh

# アプリケーション更新
git pull && ./scripts/deploy.sh
```

## 🔍 トラブルシューティング

### よくある問題

1. **接続失敗**
   - APIキーが正しいか確認
   - TestnetキーをTestnet URLで使用しているか確認
   - APIキーがスポット取引権限を持っているか確認

2. **最小注文エラー**
   - Binanceは最小10 USDT注文が必要
   - アカウント残高を確認

3. **ボットが開始しない**
   - APIキーが設定されているか確認
   - DCA設定が構成されているか確認
   - バックエンドサーバーが動作しているか確認

### エラーログ
詳細なエラーメッセージとデバッグ情報については、バックエンドコンソールを確認してください。

## 📝 ライセンス

このプロジェクトは教育および個人使用を目的としています。BinanceのAPI利用規約を確認し、自動取引に関する地域の規制に準拠してください。

## 🤝 貢献

現在は本番環境対応が完了しています。フィードバックや提案を歓迎します。

---

**⚠️ 免責事項**: このボットは教育目的です。暗号通貨取引にはリスクが伴います。大きな資金で使用する前に、少額とTestnetで十分にテストしてください。