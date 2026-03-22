/**
 * 🔐 UploadSession管理サービス
 *
 * 責任:
 * - UploadSessionの状態遷移管理
 * - Redisへのセッション保存・取得・更新
 * - ロック期限管理（lockUntil）
 */

import { Redis } from 'ioredis';

import { UPLOAD_CONSTANTS } from './constants.js';

// セッション状態
export enum UploadSessionStatus {
  CREATED = 'CREATED', // PUT受付可
  UPLOADING = 'UPLOADING', // 基本PUT拒否（409）
  UPLOADED = 'UPLOADED', // completeのみ可、PUTは409
  COMPLETED = 'COMPLETED', // 完了済み
  FAILED = 'FAILED', // 失敗（createからやり直し）
  EXPIRED = 'EXPIRED', // TTL切れ
}

// セッションデータ
export interface UploadSessionData {
  uploadId: string; // mediaIdと同一
  userId: string;
  kind: string; // MediaType
  filename: string;
  contentType: string;
  declaredBytes: number; // 申告値（参考用）
  maxBytes: number; // kind別の上限値
  s3Key: string;
  status: UploadSessionStatus;
  receivedBytes?: number; // PUTで受信したバイト数
  etag?: string;
  width?: number;
  height?: number;
  lockUntil?: Date; // UPLOADINGロック期限
  createdAt: Date;
  // expiresAtはRedis TTLで管理するため保存しない
}

export class UploadSessionManager {
  constructor(private redis: Redis) {}

  /**
   * セッション作成
   */
  async createSession(
    data: Omit<UploadSessionData, 'status' | 'createdAt'>
  ): Promise<UploadSessionData> {
    const uploadId = data.uploadId; // 外から渡されたuploadIdを使用
    const now = new Date();

    const session: UploadSessionData = {
      ...data,
      uploadId,
      status: UploadSessionStatus.CREATED,
      createdAt: now,
    };

    const key = UPLOAD_CONSTANTS.REDIS_KEY_PREFIX + uploadId;
    await this.redis.setex(key, UPLOAD_CONSTANTS.SESSION_TTL, JSON.stringify(session));

    return session;
  }

  /**
   * セッション取得
   */
  async getSession(uploadId: string): Promise<UploadSessionData | null> {
    const key = UPLOAD_CONSTANTS.REDIS_KEY_PREFIX + uploadId;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const session: UploadSessionData = JSON.parse(data);
    session.createdAt = new Date(session.createdAt);
    if (session.lockUntil) {
      session.lockUntil = new Date(session.lockUntil);
    }

    return session;
  }

  /**
   * 状態更新
   */
  async updateStatus(uploadId: string, status: UploadSessionStatus): Promise<boolean> {
    const session = await this.getSession(uploadId);
    if (!session) {
      return false;
    }

    session.status = status;
    const key = UPLOAD_CONSTANTS.REDIS_KEY_PREFIX + uploadId;
    const ttl = await this.redis.ttl(key);

    if (ttl > 0) {
      await this.redis.setex(key, ttl, JSON.stringify(session));
      return true;
    }

    return false;
  }

  /**
   * PUT開始（UPLOADINGに遷移）
   */
  async startUpload(uploadId: string): Promise<{ allowed: boolean; session?: UploadSessionData }> {
    const session = await this.getSession(uploadId);
    if (!session) {
      return { allowed: false };
    }

    // CREATED以外は拒否
    if (session.status !== UploadSessionStatus.CREATED) {
      // ロック期限切れなら再PUT許可
      if (
        session.status === UploadSessionStatus.UPLOADING &&
        session.lockUntil &&
        new Date() > session.lockUntil
      ) {
        session.status = UploadSessionStatus.CREATED;
        session.lockUntil = undefined;
        const key = UPLOAD_CONSTANTS.REDIS_KEY_PREFIX + uploadId;
        const ttl = await this.redis.ttl(key);
        await this.redis.setex(key, ttl, JSON.stringify(session));
      } else {
        return { allowed: false, session };
      }
    }

    // UPLOADINGに遷移
    session.status = UploadSessionStatus.UPLOADING;
    session.lockUntil = new Date(Date.now() + UPLOAD_CONSTANTS.UPLOADING_LOCK_DURATION * 1000);
    const key = UPLOAD_CONSTANTS.REDIS_KEY_PREFIX + uploadId;
    const ttl = await this.redis.ttl(key);
    await this.redis.setex(key, ttl, JSON.stringify(session));

    return { allowed: true, session };
  }

  /**
   * PUT完了（UPLOADEDに遷移）
   */
  async completeUpload(uploadId: string, receivedBytes: number, etag: string): Promise<boolean> {
    const session = await this.getSession(uploadId);
    if (!session || session.status !== UploadSessionStatus.UPLOADING) {
      return false;
    }

    session.status = UploadSessionStatus.UPLOADED;
    session.receivedBytes = receivedBytes;
    session.etag = etag;
    session.lockUntil = undefined;
    const key = UPLOAD_CONSTANTS.REDIS_KEY_PREFIX + uploadId;
    const ttl = await this.redis.ttl(key);
    await this.redis.setex(key, ttl, JSON.stringify(session));

    return true;
  }

  /**
   * セッション失敗（FAILEDに遷移）
   */
  async failSession(uploadId: string, _reason: string): Promise<boolean> {
    const session = await this.getSession(uploadId);
    if (!session) {
      return false;
    }

    session.status = UploadSessionStatus.FAILED;
    const key = UPLOAD_CONSTANTS.REDIS_KEY_PREFIX + uploadId;
    const ttl = await this.redis.ttl(key);
    await this.redis.setex(key, ttl, JSON.stringify(session));

    return true;
  }

  /**
   * セッション完了（COMPLETEDに遷移）
   */
  async completeSession(uploadId: string): Promise<boolean> {
    return this.updateStatus(uploadId, UploadSessionStatus.COMPLETED);
  }

  /**
   * セッション削除（COMPLETED後）
   */
  async deleteSession(uploadId: string): Promise<boolean> {
    const key = UPLOAD_CONSTANTS.REDIS_KEY_PREFIX + uploadId;
    const result = await this.redis.del(key);
    return result > 0;
  }

  /**
   * セッションのTTLを取得
   */
  async getTTL(uploadId: string): Promise<number> {
    const key = UPLOAD_CONSTANTS.REDIS_KEY_PREFIX + uploadId;
    return await this.redis.ttl(key);
  }
}
