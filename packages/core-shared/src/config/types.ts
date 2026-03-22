/**
 * 🎯 設定型定義
 *
 * 全設定システムで使用する型定義を統一
 */

// 基本設定型
export interface BaseConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  debug: boolean;
}

// データベース設定型
export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  timeout: number;
}

// Redis設定型
export interface RedisConfig {
  url: string;
  maxRetries: number;
  retryDelay: number;
}

// S3設定型
export interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

// 認証設定型
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  bcryptRounds: number;
}

// メディア設定型
export interface MediaConfig {
  maxFileSize: number;
  allowedTypes: string[];
  variants: string[];
}

// WebSocket設定型
export interface WebSocketConfig {
  enabled: boolean;
  path: string;
  maxConnections: number;
}

// アップロード設定型
export interface UploadConfig {
  maxFiles: number;
  timeout: number;
  chunkSize: number;
}

// 環境設定型
export type Environment = 'development' | 'production' | 'test';

// 設定バリデーション結果型
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
