import { GraphQLContext } from '../../graphql/context.js';

/**
 * サイト機能の有効性をチェック
 */
export async function checkSiteFeatureEnabled(
  context: GraphQLContext,
  featureName: string
): Promise<boolean> {
  try {
    const siteFeature = await context.prisma.siteFeatureSetting.findUnique({
      where: { featureName },
    });

    // 設定が存在しない場合はデフォルトで有効
    return siteFeature?.isEnabled ?? true;
  } catch (error) {
    context.fastify.log.error({ err: error }, 'サイト機能チェックエラー:');
    return true; // エラー時はデフォルトで有効
  }
}
