/**
 * UploadSession定数
 */

export const UPLOAD_CONSTANTS = {
  // セッションTTL（秒）
  SESSION_TTL: 600, // 10分

  // UPLOADINGロック期間（秒）
  UPLOADING_LOCK_DURATION: 120, // 2分

  // kind別の上限値（バイト）
  MAX_BYTES_BY_KIND: {
    POST: 10 * 1024 * 1024, // 10MB
    AVATAR: 5 * 1024 * 1024, // 5MB
    COVER: 10 * 1024 * 1024, // 10MB
    OGP: 5 * 1024 * 1024, // 5MB
  },

  // Redisキープレフィックス
  REDIS_KEY_PREFIX: 'upload:session:',
} as const;
