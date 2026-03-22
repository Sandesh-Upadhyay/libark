import { closeAllQueues } from '@libark/queues';

// 🚫 PostWorker は削除されました（プリサインドS3システムに移行済み）
// 🚫 CommentProcessingWorker は削除されました（プリサインドS3システムに移行済み）
import { MediaProcessingWorker } from './workers/MediaProcessingWorker.js';
import { S3EventWorker } from './workers/S3EventWorker.js';
import { MediaCleanupWorker } from './workers/MediaCleanupWorker.js';
import { P2PTradeTimeoutWorker } from './workers/P2PTradeTimeoutWorker.js';
import { S3EventListener } from './services/S3EventListener.js';
import { MediaCleanupScheduler } from './services/MediaCleanupScheduler.js';
import { P2PTradeTimeoutScheduler } from './services/P2PTradeTimeoutScheduler.js';
import config from './config/index.js';

// ワーカーサービスの起動
async function startWorkers() {
  console.log(`ワーカーサービスを起動しています...`);
  console.log(`環境: ${config.nodeEnv}`);

  // ワーカーの起動
  // 🚫 ImageProcessingWorker は削除されました（プリサインドS3システムに移行済み）
  // 🚫 PostWorker は削除されました（プリサインドS3システムに移行済み）
  // 🚫 CommentProcessingWorker は削除されました（プリサインドS3システムに移行済み）

  // メディア処理ワーカーの起動
  const mediaProcessingWorker = new MediaProcessingWorker();
  const s3EventWorker = new S3EventWorker();
  const mediaCleanupWorker = new MediaCleanupWorker();
  const p2pTradeTimeoutWorker = new P2PTradeTimeoutWorker();
  const s3EventListener = new S3EventListener();
  const mediaCleanupScheduler = new MediaCleanupScheduler();
  const p2pTradeTimeoutScheduler = new P2PTradeTimeoutScheduler();

  // S3イベントリスナーを開始
  await s3EventListener.start();

  // メディアクリーンアップスケジューラーを開始
  mediaCleanupScheduler.start();

  // P2Pタイムアウトスケジューラーを開始
  p2pTradeTimeoutScheduler.start();

  console.log(`✅ 全ワーカーが正常に起動しました`);

  return {
    mediaProcessingWorker,
    s3EventWorker,
    mediaCleanupWorker,
    p2pTradeTimeoutWorker,
    s3EventListener,
    mediaCleanupScheduler,
    p2pTradeTimeoutScheduler,
  };
}

// ワーカーを起動
const workers = await startWorkers();

// シャットダウン処理
async function gracefulShutdown(): Promise<void> {
  console.log('シャットダウンを開始します...');

  // ワーカーを停止
  // 🚫 imageWorker は削除されました（プリサインドS3システムに移行済み）
  // 🚫 postWorker は削除されました（プリサインドS3システムに移行済み）
  // 🚫 commentWorker は削除されました（プリサインドS3システムに移行済み）

  // メディア処理ワーカーを停止
  if (workers.mediaProcessingWorker) {
    await workers.mediaProcessingWorker.close();
  }
  if (workers.s3EventWorker) {
    await workers.s3EventWorker.close();
  }
  if (workers.mediaCleanupWorker) {
    await workers.mediaCleanupWorker.close();
  }
  if (workers.p2pTradeTimeoutWorker) {
    await workers.p2pTradeTimeoutWorker.close();
  }
  if (workers.s3EventListener) {
    await workers.s3EventListener.stop();
  }
  if (workers.mediaCleanupScheduler) {
    workers.mediaCleanupScheduler.stop();
  }
  if (workers.p2pTradeTimeoutScheduler) {
    workers.p2pTradeTimeoutScheduler.stop();
  }

  // キューを閉じる
  await closeAllQueues();

  console.log('正常にシャットダウンしました');
  process.exit(0);
}

// シャットダウン処理の登録
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 未処理のエラーハンドリング
process.on('unhandledRejection', reason => {
  console.error('未処理のPromise拒否:', reason);
});

process.on('uncaughtException', error => {
  console.error('未捕捉の例外:', error);
  gracefulShutdown().catch(err => {
    console.error('シャットダウン中にエラーが発生しました:', err);
    process.exit(1);
  });
});
