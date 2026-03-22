/**
 * ユーザーサンプルデータ
 * シードで使用するユーザーデータを定義
 */

import type { UserData, RoleData, PermissionData } from '../utils/types';

/**
 * 作成するユーザーのリスト（現実的なプロフィール）
 */
export const usersData: UserData[] = [
  // システム用ユーザー（匿名アップロード等で使用）
  {
    username: 'system',
    email: 'system@libark.internal',
    password: 'system_password_not_used',
    displayName: 'System',
    bio: 'LIBARK システム内部処理用ユーザー',
    role: 'USER',
  },
  {
    username: 'admin',
    email: 'admin@libark.io',
    password: 'Password123',
    displayName: '管理者',
    bio: 'LIBARK開発チームです。質問やご意見はお気軽にどうぞ！🚀',
    role: 'ADMIN',
  },
  {
    username: 'tanaka_dev',
    email: 'tanaka.taro@libark.io',
    password: 'Password123',
    displayName: '田中太郎',
    bio: 'フルスタックエンジニア👨‍💻 React/Node.js/TypeScript好き。週末はOSS活動してます',
    role: 'USER',
  },
  {
    username: 'hanako_ux',
    email: 'sato.hanako@libark.io',
    password: 'Password123',
    displayName: '佐藤花子',
    bio: 'UX/UIデザイナー🎨 ユーザーに寄り添うデザインを心がけています。本と映画が大好き📚🎬',
    role: 'USER',
  },
  {
    username: 'nomad_suzuki',
    email: 'suzuki.ichiro@libark.io',
    password: 'Password123',
    displayName: '鈴木一郎',
    bio: 'フリーランスエンジニア✈️ リモートワークで世界を旅しながら開発中。現在地：バリ島🏝️',
    role: 'USER',
  },
  {
    username: 'misaki_foodie',
    email: 'takahashi.misaki@libark.io',
    password: 'Password123',
    displayName: '高橋美咲',
    bio: 'フードテックスタートアップCTO👩‍🍳 料理×技術で世界を変えたい。カフェ巡りも趣味☕',
    role: 'USER',
  },
  {
    username: 'kenta_sports',
    email: 'ito.kenta@libark.io',
    password: 'Password123',
    displayName: '伊藤健太',
    bio: 'スポーツアプリ開発者⚽ データ分析でスポーツをもっと面白く！野球観戦が生きがい⚾',
    role: 'USER',
  },
  {
    username: 'yumi_artist',
    email: 'watanabe.yumi@libark.io',
    password: 'Password123',
    displayName: '渡辺由美',
    bio: 'クリエイティブテクノロジスト🎵 音楽とアートをプログラミングで表現。NFTアート制作中🎨',
    role: 'USER',
  },
  {
    username: 'naoki_gamer',
    email: 'yamada.naoki@libark.io',
    password: 'Password123',
    displayName: '山田直樹',
    bio: 'ゲーム開発エンジニア🎮 Unity/Unreal Engine使い。インディーゲーム制作が夢✨',
    role: 'USER',
  },
  {
    username: 'mai_wellness',
    email: 'nakamura.mai@libark.io',
    password: 'Password123',
    displayName: '中村麻衣',
    bio: 'ヘルステックエンジニア🧘‍♀️ AI×健康で人々の幸せに貢献。ヨガインストラクター資格も持ってます',
    role: 'USER',
  },
  {
    username: 'takuya_photo',
    email: 'kobayashi.takuya@libark.io',
    password: 'Password123',
    displayName: '小林拓也',
    bio: '写真好きエンジニア📷 画像処理・コンピュータビジョンが専門。週末は街角スナップ撮影📸',
    role: 'USER',
  },
  {
    username: 'alice_ml',
    email: 'johnson.alice@libark.io',
    password: 'Password123',
    displayName: 'Alice Johnson',
    bio: 'AI/ML Researcher🤖 PhD in Computer Science. Working on NLP and computer vision. Love hiking🥾',
    role: 'USER',
  },
  {
    username: 'hiroshi_blockchain',
    email: 'matsumoto.hiroshi@libark.io',
    password: 'Password123',
    displayName: '松本寛',
    bio: 'ブロックチェーンエンジニア⛓️ Web3の未来を信じてます。DeFi、NFT、DAOに興味あり',
    role: 'USER',
  },
  {
    username: 'seller_yuki',
    email: 'seller.yuki@libark.io',
    password: 'Password123',
    displayName: '田中雪',
    bio: 'デジタルコンテンツクリエイター🎨 イラスト・動画制作で生計を立てています。',
    role: 'SELLER',
  },
  {
    username: 'p2p_trader_ken',
    email: 'p2p.ken@libark.io',
    password: 'Password123',
    displayName: '佐藤健',
    bio: 'P2P取引専門💰 暗号通貨の売買サポートをしています。安全取引を心がけています。',
    role: 'P2P_SELLER',
  },
  {
    username: 'p2p_trader_yumi',
    email: 'p2p.yumi@libark.io',
    password: 'Password123',
    displayName: '渡辺由美',
    bio: 'P2P取引者💰 暗号通貨の売買をサポートしています。迅速な対応が得意です。',
    role: 'P2P_SELLER',
  },
  {
    username: 'p2p_trader_naoki',
    email: 'p2p.naoki@libark.io',
    password: 'Password123',
    displayName: '山田直樹',
    bio: 'P2P取引者💰 暗号通貨の売買をサポートしています。24時間対応可能です。',
    role: 'P2P_SELLER',
  },
  // P2P取引テスト用ユーザー
  {
    username: 'user1',
    email: 'user1@libark.io',
    password: 'Password123',
    displayName: 'テストユーザー1',
    bio: 'P2P取引テスト用ユーザー',
    role: 'USER',
  },
  {
    username: 'user2',
    email: 'user2@libark.io',
    password: 'Password123',
    displayName: 'テストユーザー2',
    bio: 'P2P取引テスト用ユーザー',
    role: 'USER',
  },
  {
    username: 'user3',
    email: 'user3@libark.io',
    password: 'Password123',
    displayName: 'テストユーザー3',
    bio: 'P2P取引テスト用ユーザー',
    role: 'USER',
  },
  {
    username: 'user4',
    email: 'user4@libark.io',
    password: 'Password123',
    displayName: 'テストユーザー4',
    bio: 'P2P取引テスト用ユーザー',
    role: 'USER',
  },
  {
    username: 'user5',
    email: 'user5@libark.io',
    password: 'Password123',
    displayName: 'テストユーザー5',
    bio: 'P2P取引テスト用ユーザー',
    role: 'USER',
  },
  {
    username: 'user6',
    email: 'user6@libark.io',
    password: 'Password123',
    displayName: 'テストユーザー6',
    bio: 'P2P取引テスト用ユーザー',
    role: 'USER',
  },
  {
    username: 'user7',
    email: 'user7@libark.io',
    password: 'Password123',
    displayName: 'テストユーザー7',
    bio: 'P2P取引テスト用ユーザー',
    role: 'USER',
  },
];

/**
 * ロールデータ
 */
export const roleData: RoleData[] = [
  {
    name: 'USER',
    description: '一般ユーザー',
  },
  {
    name: 'ADMIN',
    description: '管理者',
  },
  {
    name: 'SELLER',
    description: 'コンテンツ販売者',
  },
  {
    name: 'P2P_SELLER',
    description: 'P2P取引者',
  },
];

/**
 * 権限データ
 */
export const permissionData: PermissionData[] = [
  {
    name: 'BASIC_USER',
    description: '基本ユーザー権限（デフォルト）',
  },
  {
    name: 'CONTENT_SELLER',
    description: 'コンテンツ販売権限（売上残高利用可能）',
  },
  {
    name: 'P2P_TRADER',
    description: 'P2P取引権限（P2P残高利用可能）',
  },
  {
    name: 'ADMIN_PANEL',
    description: '管理者パネルへのアクセス',
  },
  {
    name: 'MANAGE_USERS',
    description: 'ユーザー管理',
  },
];

/**
 * ユーザー権限マッピング
 * 特定のユーザーに付与する追加権限を定義
 */
export const userPermissionMappings = {
  seller_yuki: ['CONTENT_SELLER'],
  p2p_trader_ken: ['P2P_TRADER', 'CONTENT_SELLER'], // 複数権限のデモ
  admin: ['ADMIN_PANEL', 'MANAGE_USERS'],
} as const;
