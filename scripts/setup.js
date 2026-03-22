#!/usr/bin/env node

/**
 * 🎯 LIBARK開発環境自動セットアップスクリプト
 *
 * 1コマンドで開発環境を完全にセットアップ
 * PNPM前提の最適化された設定
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  log(`${colors.blue}実行中: ${command}${colors.reset}`);
  try {
    return execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options
    });
  } catch (error) {
    log(`${colors.red}エラー: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function checkRequirements() {
  log(`${colors.bold}🔍 必要な環境をチェック中...${colors.reset}`);

  // Node.js バージョンチェック
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 20) {
    log(`${colors.red}❌ Node.js 20以上が必要です。現在: ${nodeVersion}${colors.reset}`);
    process.exit(1);
  }
  log(`${colors.green}✅ Node.js ${nodeVersion}${colors.reset}`);

  // PNPM チェック
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    log(`${colors.green}✅ PNPM ${pnpmVersion}${colors.reset}`);
  } catch {
    log(`${colors.red}❌ PNPMがインストールされていません${colors.reset}`);
    log(`${colors.yellow}インストール: npm install -g pnpm${colors.reset}`);
    process.exit(1);
  }

  // Docker チェック（オプション）
  try {
    execSync('docker --version', { stdio: 'ignore' });
    log(`${colors.green}✅ Docker利用可能${colors.reset}`);
  } catch {
    log(`${colors.yellow}⚠️ Dockerが見つかりません（オプション）${colors.reset}`);
  }
}

function setupEnvironment() {
  log(`${colors.bold}🔧 環境ファイルをセットアップ中...${colors.reset}`);

  // .env.template から開発/本番環境ファイルを生成
  if (fs.existsSync('.env.template') && !fs.existsSync('.env.development')) {
    fs.copyFileSync('.env.template', '.env.development');
    log(`${colors.green}✅ .env.development を作成しました${colors.reset}`);
  }

  if (fs.existsSync('.env.template') && !fs.existsSync('.env.production')) {
    fs.copyFileSync('.env.template', '.env.production');
    log(`${colors.green}✅ .env.production を作成しました${colors.reset}`);
  }

  // .npmrc の確認
  if (!fs.existsSync('.npmrc')) {
    const npmrcContent = `shamefully-hoist=true
auto-install-peers=true
strict-peer-dependencies=false
enable-pre-post-scripts=true`;
    fs.writeFileSync('.npmrc', npmrcContent);
    log(`${colors.green}✅ .npmrcファイルを作成しました${colors.reset}`);
  }
}

function installDependencies() {
  log(`${colors.bold}📦 依存関係をインストール中...${colors.reset}`);
  exec('pnpm install');
  log(`${colors.green}✅ 依存関係のインストール完了${colors.reset}`);
}

function buildPackages() {
  log(`${colors.bold}🏗️ パッケージをビルド中...${colors.reset}`);
  exec('pnpm build');
  log(`${colors.green}✅ パッケージのビルド完了${colors.reset}`);
}

function setupDatabase() {
  log(`${colors.bold}🗄️ データベースをセットアップ中...${colors.reset}`);

  try {
    exec('pnpm db:generate');
    log(`${colors.green}✅ Prismaクライアント生成完了${colors.reset}`);
  } catch (_error) {
    log(`${colors.yellow}⚠️ データベース設定をスキップ（後で手動実行）${colors.reset}`);
    log(`${colors.yellow}実行コマンド: pnpm db:generate && pnpm db:migrate${colors.reset}`);
  }
}

function showNextSteps() {
  log(`${colors.bold}🎉 セットアップ完了！${colors.reset}`);
  log('');
  log(`${colors.bold}次のステップ:${colors.reset}`);
  log(`${colors.blue}開発サーバー起動: pnpm dev${colors.reset}`);
  log(`${colors.blue}フロントエンド: http://localhost:3000${colors.reset}`);
  log(`${colors.blue}バックエンド: http://localhost:8000${colors.reset}`);
  log(`${colors.blue}Prisma Studio: pnpm db:studio${colors.reset}`);
  log(`${colors.blue}Storybook: cd apps/frontend && pnpm storybook${colors.reset}`);
  log('');
  log(`${colors.bold}Docker使用の場合:${colors.reset}`);
  log(`${colors.blue}docker-compose up -d${colors.reset}`);
  log('');
  log(`${colors.green}🚀 開発を始めましょう！${colors.reset}`);
}

function main() {
  log(`${colors.bold}🎯 LIBARK開発環境セットアップ開始${colors.reset}`);
  log('');

  checkRequirements();
  setupEnvironment();
  installDependencies();
  buildPackages();
  setupDatabase();
  showNextSteps();
}

if (process.argv[1] === __filename) {
  main();
}
