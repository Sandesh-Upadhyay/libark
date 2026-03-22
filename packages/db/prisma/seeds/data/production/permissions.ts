/**
 * 本番環境用権限データ
 * システムの基本権限とロール定義
 */

export interface PermissionData {
  name: string;
  description: string;
}

export interface RoleData {
  name: string;
  description: string;
  permissions: string[];
}

/**
 * システム権限定義（本番環境用）
 */
export const PRODUCTION_PERMISSIONS: PermissionData[] = [
  // 基本権限
  { name: 'READ_POSTS', description: '投稿の閲覧' },
  { name: 'CREATE_POSTS', description: '投稿の作成' },
  { name: 'EDIT_OWN_POSTS', description: '自分の投稿の編集' },
  { name: 'DELETE_OWN_POSTS', description: '自分の投稿の削除' },
  { name: 'COMMENT_ON_POSTS', description: '投稿へのコメント' },
  { name: 'LIKE_POSTS', description: '投稿へのいいね' },

  // メッセージ機能
  { name: 'SEND_MESSAGES', description: 'メッセージの送信' },
  { name: 'READ_MESSAGES', description: 'メッセージの閲覧' },

  // ウォレット機能
  { name: 'USE_WALLET', description: 'ウォレット機能の使用' },
  { name: 'DEPOSIT_FUNDS', description: '入金機能' },
  { name: 'WITHDRAW_FUNDS', description: '出金機能' },

  // コンテンツ販売
  { name: 'SELL_CONTENT', description: 'コンテンツ販売機能' },
  { name: 'P2P_TRADING', description: 'P2P取引機能' },

  // 管理者権限
  { name: 'ADMIN_PANEL', description: '管理パネルへのアクセス' },
  { name: 'MANAGE_USERS', description: 'ユーザー管理' },
  { name: 'MANAGE_CONTENT', description: 'コンテンツ管理' },
  { name: 'MANAGE_PAYMENTS', description: '決済管理' },
  { name: 'MANAGE_SITE_SETTINGS', description: 'サイト設定管理' },
  { name: 'VIEW_SYSTEM_LOGS', description: 'システムログ閲覧' },

  // プレミアム機能
  { name: 'PREMIUM_FEATURES', description: 'プレミアム機能の使用' },
  { name: 'ADVANCED_ANALYTICS', description: '高度な分析機能' },
  { name: 'PRIORITY_SUPPORT', description: '優先サポート' },

  // システム管理
  { name: 'BULK_OPERATIONS', description: '一括操作' },
  { name: 'SYSTEM_MAINTENANCE', description: 'システムメンテナンス' },
  { name: 'SECURITY_MANAGEMENT', description: 'セキュリティ管理' },
  { name: 'API_ACCESS', description: 'API アクセス' },
  { name: 'DEVELOPER_TOOLS', description: '開発者ツール' },
];

/**
 * システムロール定義（本番環境用）
 */
export const PRODUCTION_ROLES: RoleData[] = [
  {
    name: 'SUPER_ADMIN',
    description: 'システム全体の管理者',
    permissions: PRODUCTION_PERMISSIONS.map(p => p.name), // 全権限
  },
  {
    name: 'ADMIN',
    description: 'サイト管理者',
    permissions: [
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      'SEND_MESSAGES',
      'READ_MESSAGES',
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      'ADMIN_PANEL',
      'MANAGE_USERS',
      'MANAGE_CONTENT',
      'MANAGE_PAYMENTS',
      'MANAGE_SITE_SETTINGS',
      'VIEW_SYSTEM_LOGS',
    ],
  },
  {
    name: 'PREMIUM_USER',
    description: 'プレミアムユーザー',
    permissions: [
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      'SEND_MESSAGES',
      'READ_MESSAGES',
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      'PREMIUM_FEATURES',
      'ADVANCED_ANALYTICS',
      'PRIORITY_SUPPORT',
    ],
  },
  {
    name: 'CONTENT_SELLER',
    description: 'コンテンツ販売者',
    permissions: [
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      'SEND_MESSAGES',
      'READ_MESSAGES',
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      'SELL_CONTENT',
    ],
  },
  {
    name: 'P2P_TRADER',
    description: 'P2P取引者',
    permissions: [
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      'SEND_MESSAGES',
      'READ_MESSAGES',
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      'P2P_TRADING',
    ],
  },
  {
    name: 'BASIC_USER',
    description: '一般ユーザー',
    permissions: [
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      'SEND_MESSAGES',
      'READ_MESSAGES',
    ],
  },
];
