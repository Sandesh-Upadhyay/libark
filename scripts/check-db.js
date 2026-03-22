#!/usr/bin/env node

/**
 * データベース状態確認スクリプト
 *
 * 使用方法:
 * node scripts/check-db.js
 *
 * 機能:
 * - データベース接続確認
 * - テーブル一覧表示
 * - 通知・コメントテーブルの存在確認
 * - テーブル構造の表示
 */

import { createPrismaClient } from "@libark/db/server";

const prisma = createPrismaClient({
  log: ["query", "error", "warn"],
});

async function checkDatabase() {
  try {
    console.log("🔍 データベース状態確認を開始します...\n");

    // 1. データベース接続確認
    console.log("📡 データベース接続確認中...");
    await prisma.$connect();
    console.log("✅ データベース接続成功\n");

    // 2. 全テーブル一覧取得
    console.log("📋 テーブル一覧取得中...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log("📊 データベース内のテーブル:");
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    console.log("");

    // 3. 通知・コメントテーブルの存在確認
    console.log("🔍 通知・コメントテーブルの存在確認...");
    const targetTables = ["notifications", "comments"];
    const existingTables = tables.map((t) => t.table_name);

    for (const tableName of targetTables) {
      if (existingTables.includes(tableName)) {
        console.log(`✅ ${tableName} テーブル: 存在します`);

        // テーブル構造を確認
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = ${tableName}
          ORDER BY ordinal_position;
        `;

        console.log(`   📝 ${tableName} テーブル構造:`);
        columns.forEach((col) => {
          const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL";
          const defaultVal = col.column_default
            ? ` DEFAULT ${col.column_default}`
            : "";
          console.log(
            `     - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`
          );
        });

        // レコード数確認
        try {
          const count = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          console.log(`   📊 レコード数: ${count[0].count}\n`);
        } catch (error) {
          console.log(`   ⚠️  レコード数取得エラー: ${error.message}\n`);
        }
      } else {
        console.log(`❌ ${tableName} テーブル: 存在しません`);
      }
    }

    // 4. Prismaクライアントのモデル確認
    console.log("🔧 Prismaクライアントのモデル確認...");
    const models = Object.keys(prisma).filter(
      (key) =>
        !key.startsWith("_") &&
        !key.startsWith("$") &&
        typeof prisma[key] === "object" &&
        prisma[key] !== null
    );

    console.log("📦 Prismaクライアントで利用可能なモデル:");
    models.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model}`);
    });
    console.log("");

    // 5. 通知・コメントモデルの存在確認
    console.log("🔍 通知・コメントモデルの存在確認...");
    const targetModels = ["notification", "comment"];

    for (const modelName of targetModels) {
      if (models.includes(modelName)) {
        console.log(`✅ ${modelName} モデル: 利用可能`);

        // モデルのテスト実行
        try {
          await prisma[modelName].findMany({
            take: 1,
          });
          console.log(`   ✅ ${modelName} モデルのクエリ実行: 成功`);
        } catch (error) {
          console.log(`   ❌ ${modelName} モデルのクエリ実行: 失敗`);
          console.log(`      エラー: ${error.message}`);
        }
      } else {
        console.log(`❌ ${modelName} モデル: 利用不可`);
      }
    }

    console.log("\n🎉 データベース状態確認が完了しました!");
  } catch (error) {
    console.error("❌ データベース確認中にエラーが発生しました:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
checkDatabase()
  .then(() => {
    console.log("✅ スクリプトが正常に完了しました");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ スクリプト実行中にエラーが発生しました:", error);
    process.exit(1);
  });
