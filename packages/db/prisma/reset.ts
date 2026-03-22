import { prisma } from '../src/server';

import { clearDatabase } from './seeds/utils/database';

async function resetDatabase(): Promise<void> {
  try {
    console.log('🗑️ データベースを初期化します...');

    await clearDatabase(prisma);

    console.log('✅ データベースの初期化が完了しました');
  } catch (error) {
    console.error('❌ データベースの初期化中にエラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 初期化中にエラーが発生しました:', error);
    process.exit(1);
  });
