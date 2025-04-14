// ★ コメントアウトされた Task と Schedule の型定義を削除

// キャラクターの気分
export type CharacterMood = "happy" | "sad" | "angry" | "neutral"

// キャラクタータイプ
export type CharacterType = "cat" | "dog"

// メッセージ型定義
export interface Message {
  id: string
  content: string
  sender: "user" | "character"
  timestamp: Date
}

// メッセージ分析結果
export interface MessageAnalysis {
  intent: string
  sentiment: string
  keywords: string[]
  intensity: number
}
