#!/usr/bin/env node

import { S3Client, ListBucketsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

function detectProvider(endpoint) {
  const url = endpoint.toLowerCase();
  if (url.includes('amazonaws.com')) return 'AWS S3';
  if (url.includes('digitaloceanspaces.com')) return 'DigitalOcean Spaces';
  if (url.includes('r2.cloudflarestorage.com')) return 'Cloudflare R2';
  if (url.includes('wasabisys.com')) return 'Wasabi';
  return 'Generic S3';
}

function getProviderConfig(provider) {
  const configs = {
    'AWS S3': { forcePathStyle: false },
    'DigitalOcean Spaces': { forcePathStyle: true },
    'Cloudflare R2': { forcePathStyle: false },
    'Wasabi': { forcePathStyle: true },
  };
  return configs[provider] || { forcePathStyle: true };
}

async function verifyS3Config() {
  console.log('🔍 S3設定検証開始...\n');

  const vars = ['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET', 'S3_REGION', 'S3_ENDPOINT'];
  const missing = vars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.log(`❌ 環境変数不足: ${missing.join(', ')}`);
    process.exit(1);
  }

  const provider = detectProvider(process.env.S3_ENDPOINT);
  const config = getProviderConfig(provider);
  
  console.log(`🌐 プロバイダー: ${provider}`);
  console.log(`🔧 forcePathStyle: ${config.forcePathStyle}`);

  const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: config.forcePathStyle,
  });

  try {
    const result = await s3.send(new ListBucketsCommand({}));
    console.log(`✅ 接続成功! ${result.Buckets?.length || 0}個のバケット`);
    
    await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET }));
    console.log(`✅ バケット "${process.env.S3_BUCKET}" アクセス可能`);
    
    console.log('\n✅ S3設定検証完了！');
  } catch (error) {
    console.log(`❌ エラー: ${error.message}`);
    process.exit(1);
  }
}

verifyS3Config().catch(console.error);
