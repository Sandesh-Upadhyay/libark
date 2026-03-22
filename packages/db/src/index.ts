/**
 * 🏆 @libark/db - メインエクスポート
 *
 * ✅ 後方互換性のためのデフォルトエクスポート
 * ✅ 新しいコードでは /server, /client, /types を使用推奨
 */

// 後方互換性のため、サーバー側エクスポートを再エクスポート
export * from './server.js';

// 型定義も含める
export * from './types.js';
