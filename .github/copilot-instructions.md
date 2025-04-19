# Agentを使用している時は以下の指示に従ってださい。
- 特に指定しない限りは絶対に日本語で出力してください。
- コードのコメントは日本語で書いてください。
- コードの中に日本語のコメントを入れてください。
- 基本的には自走しましょう。ユーザーはあなたを信頼してからコード作成を依頼しています。
- ユーザーが求めていることを理解し、必要な情報を提供してください。

# PixelWork プロジェクト詳細

## プロジェクト概要
PixelWorkは、ピクセルアートキャラクター（猫または犬）と対話形式でタスク管理やスケジュール管理ができるWebアプリケーションです。キャラクターとのコミュニケーションを通じて、日常のタスク管理をより楽しく効率的に行うことができます。

## 主要機能
1. **ユーザー認証**: Supabaseを利用したユーザー登録、ログイン、ログアウト機能
2. **タスク管理**: タスクの作成、完了、一覧表示機能
3. **スケジュール管理**: 予定の作成、一覧表示機能
4. **キャラクターとの対話**: AIによるメッセージ分析と応答生成
5. **キャラクターのカスタマイズ**: 猫または犬のキャラクターを選択可能
6. **感情分析**: ユーザーのメッセージから感情や意図を分析し、キャラクターの態度や気分を変化

## 技術スタック
- **フロントエンド**: Next.js 15.2.4、React 19、TypeScript、Tailwind CSS 4
- **バックエンド**: Next.jsのAPI Routes、Supabase
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **UI**: Radix UI コンポーネント、Lucide React アイコン
- **デプロイ**: Vercel

## プロジェクト構造
```
project/
├── app/                      # Next.jsのApp Router
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx              # メインページ
│   ├── login/                # ログインページ
│   ├── register/             # ユーザー登録ページ
│   ├── reset-password/       # パスワードリセットページ
│   ├── types/                # データベース型定義
│   └── utils/                # Supabase設定
├── public/                   # 静的ファイル
├── src/
│   ├── features/             # 機能コンポーネント
│   │   ├── cat-character.tsx # 猫キャラクター
│   │   ├── dog-character.tsx # 犬キャラクター
│   │   ├── components/       # 共通コンポーネント
│   │   └── ui/               # UI コンポーネント
│   └── shared/               # 共有機能
│       ├── hooks/            # カスタムフック
│       ├── lib/              # ユーティリティ
│       └── types/            # 型定義
```

## データモデル
Supabase上で以下のテーブルが定義されています：

1. **Task**: タスク情報
   - id: number (主キー)
   - user_id: string (外部キー)
   - task_name: string
   - is_completed: boolean
   - created_at: string (timestamp)

2. **Schedule**: スケジュール情報
   - id: number (主キー)
   - user_id: string (外部キー)
   - schedule_name: string
   - schedule_date_time: string (datetime)
   - created_at: string (timestamp)

3. **CharacterProfile**: ユーザーごとのキャラクター設定
   - id: number (主キー)
   - user_id: string (外部キー)
   - character_type: string ('cat' or 'dog')
   - character_personality: Json
   - created_at: string (timestamp)

## 特徴的な仕様
1. **コマンドシステム**: 特定のプレフィックスを使ったコマンド
   - `#task`: 新しいタスクを作成
   - `#schedule`: 新しい予定を追加
   - `#done`: タスクを完了としてマーク
   - `#status`: 現在の状態を確認
   - `#mood`: キャラクターの気分を変更

2. **キャラクター機能**:
   - リアルタイムな表情変化
   - ピクセルアートアニメーション (まばたき、小さな動き)
   - ユーザーの言葉に反応して態度変化

3. **UI/UX**:
   - レスポンシブデザイン
   - ダークモード対応
   - アクセシビリティ対応

4. **開発ガイドライン**:
   - コンポーネント設計: 再利用可能なコンポーネント
   - 状態管理: Reactフック
   - API通信: Supabase SDK
   - エラーハンドリング: 適切なエラーメッセージ表示

## 使用サービス・ライブラリ詳細

### 1. バックエンド/データベースサービス
- **Supabase**: 
  - **認証機能**: ユーザー登録、ログイン、パスワードリセット（@supabase/auth-helpers-nextjs）
  - **データ管理**: PostgreSQLデータベースによるタスク、スケジュール、キャラクター情報の管理
  - **リアルタイム機能**: データ変更の即時反映
  - **環境変数**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEYによる接続

### 2. UI/コンポーネントライブラリ
- **Radix UI**: アクセシビリティに配慮したヘッドレスUIコンポーネント
  - チェックボックス: タスク完了状態の管理
  - ポップオーバー: 日付選択など補助的なUI
  - スクロールエリア: チャット履歴の表示
  - セレクト: キャラクター選択などのドロップダウン
  - タブ: 管理画面での切り替え
  - トースト: 通知表示
- **Lucide React**: 軽量でカスタマイズ可能なSVGアイコンセット

### 3. スタイリングシステム
- **Tailwind CSS 4**: ユーティリティファーストのCSSフレームワーク
  - カスタムテーマ設定
  - レスポンシブデザイン
  - ダークモード対応
- **tailwindcss-animate**: アニメーション用の拡張機能
  - キャラクターの動きや表情変化
  - UI要素のトランジション効果

### 4. 状態・機能管理
- **カスタムフック**:
  - `useAuth`: ユーザー認証状態の管理
  - `useCharacter`: キャラクターの表情や動き、気分の制御
  - `useScheduleAssist`: 予定の追加・管理の補助
  - `useMobile`: レスポンシブ対応のための画面サイズ検出
  - `useToast`: 通知メッセージの表示管理

### 5. 日付・時間処理
- **date-fns**: 日付操作ライブラリ
  - 予定の日時フォーマット
  - 時間計算と表示
- **react-day-picker**: カレンダーUIコンポーネント

### 6. テーマ管理
- **next-themes**: テーマ切替機能
  - ダークモード/ライトモードの自動検出と切替
  - ユーザー設定の保存

