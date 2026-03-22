/**
 * メッセージサンプルデータ
 * 会話とメッセージのテストデータを定義
 */

// 1対1会話のメッセージサンプル
export const directMessages = [
  'こんにちは！元気ですか？',
  'こんにちは！元気です。お疲れ様です！',
  'ありがとうございます。今日はいい天気ですね。',
  'そうですね！散歩日和です。',
  'お仕事の調子はいかがですか？',
  'おかげさまで順調です。新しいプロジェクトが始まりました。',
  'それは良いですね！頑張ってください。',
  'ありがとうございます。応援してもらえると嬉しいです。',
  'いつでも応援していますよ！',
  'とても心強いです。ありがとうございます！',
] as const;

// グループ会話のメッセージサンプル
export const groupMessages = [
  'プロジェクトチームのグループチャットです！',
  'よろしくお願いします！',
  'こちらこそよろしくお願いします。',
  '今日のミーティングの件ですが、資料の準備はいかがですか？',
  '資料はほぼ完成しています。明日の朝一番に共有します。',
  'ありがとうございます。楽しみにしています。',
  'プレゼンテーションの練習もしておきましょう。',
  '良いアイデアですね。時間を調整しましょう。',
  'お疲れ様でした。今日も良い進捗でした。',
  'みなさんのおかげです。明日もよろしくお願いします！',
] as const;

// 会話タイトルのサンプル
export const conversationTitles = [
  'プロジェクトチーム',
  '開発チーム',
  'マーケティング会議',
  'デザインレビュー',
  '週次ミーティング',
  'ブレインストーミング',
  '進捗報告',
  'アイデア共有',
] as const;

// メッセージ設定
export const messageConfig = {
  // 作成する1対1会話の数
  directConversations: 3,
  // 作成するグループ会話の数
  groupConversations: 2,
  // 1対1会話あたりのメッセージ数
  messagesPerDirectConversation: 6,
  // グループ会話あたりのメッセージ数
  messagesPerGroupConversation: 8,
  // グループ会話の最小参加者数
  minGroupParticipants: 3,
  // グループ会話の最大参加者数
  maxGroupParticipants: 5,
  // メッセージ既読率（0.0-1.0）
  messageReadRate: 0.7,
} as const;

// メッセージタイプ
export const messageTypes = ['TEXT'] as const;

// 会話参加者のロール
export const participantRoles = {
  DIRECT: 'MEMBER' as const,
  GROUP_ADMIN: 'ADMIN' as const,
  GROUP_MEMBER: 'MEMBER' as const,
} as const;
