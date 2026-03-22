#!/usr/bin/env node

/**
 * 🪙 NOWPayments通貨アイコンダウンロードスクリプト
 *
 * NOWPayments APIから通貨情報を取得し、
 * SVGアイコンをローカルファイルシステムに永続保存
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import fetch from 'node-fetch';
import { config } from 'dotenv';

// 環境変数を読み込み
config();

// ES Moduleで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 設定
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const ICONS_DIR = path.join(__dirname, '../apps/frontend/public/currency-icons');
const CURRENCY_DATA_FILE = path.join(__dirname, '../apps/frontend/src/data/currencies.json');

// ディレクトリ作成
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

// SVGファイルをダウンロード
async function downloadSVG(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const svgContent = await response.text();
    const filePath = path.join(ICONS_DIR, filename);

    await fs.writeFile(filePath, svgContent, 'utf8');
    console.log(`✅ Downloaded: ${filename}`);

    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${filename}:`, error.message);
    return false;
  }
}

// NOWPayments APIから通貨情報を取得
async function fetchCurrencies() {
  try {
    console.log('🔄 Fetching currencies from NOWPayments API...');

    const response = await fetch('https://api.nowpayments.io/v1/full-currencies', {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NOWPayments API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.currencies || !Array.isArray(data.currencies)) {
      throw new Error('Invalid API response format');
    }

    console.log(`📊 Found ${data.currencies.length} currencies`);
    return data.currencies;
  } catch (error) {
    console.error('❌ Failed to fetch currencies:', error.message);
    process.exit(1);
  }
}

// メイン処理
async function main() {
  console.log('🚀 Starting currency icons download...');

  if (!NOWPAYMENTS_API_KEY) {
    console.error('❌ NOWPAYMENTS_API_KEY environment variable is required');
    process.exit(1);
  }

  // ディレクトリ作成
  await ensureDirectoryExists(ICONS_DIR);
  await ensureDirectoryExists(path.dirname(CURRENCY_DATA_FILE));

  // 通貨情報取得
  const currencies = await fetchCurrencies();

  // 決済可能な通貨のみフィルタ
  const paymentCurrencies = currencies.filter(
    currency => currency.available_for_payment && currency.logo_url
  );

  console.log(`💰 Processing ${paymentCurrencies.length} payment currencies...`);

  // デバッグ: 最初の5つの通貨のlogo_urlを確認
  console.log('🔍 Sample logo URLs:');
  paymentCurrencies.slice(0, 5).forEach(currency => {
    console.log(`  ${currency.code}: ${currency.logo_url}`);
  });

  // SVGアイコンダウンロード
  const downloadResults = [];
  const processedCurrencies = [];

  for (const currency of paymentCurrencies) {
    const filename = `${currency.code.toLowerCase()}.svg`;
    // 相対URLを完全URLに変換
    const fullLogoUrl = currency.logo_url.startsWith('http')
      ? currency.logo_url
      : `https://nowpayments.io${currency.logo_url}`;
    const success = await downloadSVG(fullLogoUrl, filename);

    downloadResults.push({ currency: currency.code, success });

    if (success) {
      processedCurrencies.push({
        id: currency.id,
        code: currency.code,
        name: currency.name,
        ticker: currency.ticker,
        precision: currency.precision,
        is_popular: currency.is_popular,
        is_stable: currency.is_stable,
        available_for_payment: currency.available_for_payment,
        available_for_payout: currency.available_for_payout,
        local_icon_path: `/currency-icons/${filename}`,
        original_logo_url: currency.logo_url,
        downloaded_at: new Date().toISOString(),
      });
    }
  }

  // 通貨データをJSONファイルに保存
  const currencyData = {
    currencies: processedCurrencies,
    metadata: {
      total_currencies: currencies.length,
      payment_currencies: paymentCurrencies.length,
      downloaded_count: processedCurrencies.length,
      last_updated: new Date().toISOString(),
      source: 'NOWPayments API',
    },
  };

  await fs.writeFile(CURRENCY_DATA_FILE, JSON.stringify(currencyData, null, 2), 'utf8');
  console.log(`💾 Saved currency data to: ${CURRENCY_DATA_FILE}`);

  // 結果サマリー
  const successCount = downloadResults.filter(r => r.success).length;
  const failCount = downloadResults.filter(r => !r.success).length;

  console.log('\n📈 Download Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Icons saved to: ${ICONS_DIR}`);
  console.log(`📄 Data saved to: ${CURRENCY_DATA_FILE}`);

  if (failCount > 0) {
    console.log('\n❌ Failed downloads:');
    downloadResults.filter(r => !r.success).forEach(r => console.log(`  - ${r.currency}`));
  }

  console.log('\n🎉 Currency icons download completed!');
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main };
