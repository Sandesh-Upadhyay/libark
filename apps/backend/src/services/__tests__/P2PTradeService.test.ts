/**
 * 🧪 P2PTradeService ユニットテスト
 *
 * P2P取引サービスの機能テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@libark/db';

import { P2PTradeService } from '../P2PTradeService.js';
import { WalletNotificationService } from '../WalletNotificationService.js';

describe('🧪 P2PTradeService ユニットテスト', () => {
  let p2pTradeService: P2PTradeService;
  let mockNotificationService: any;

  // テスト用ユーザーデータ
  const timestamp = Date.now();
  const testBuyer = {
    id: `buyer-${timestamp}`,
    email: `buyer-${timestamp}@test.com`,
    username: `buyer-${timestamp}`,
    displayName: 'Test Buyer',
  };

  const testSeller = {
    id: `seller-${timestamp}`,
    email: `seller-${timestamp}@test.com`,
    username: `seller-${timestamp}`,
    displayName: 'Test Seller',
  };

  const testOffer = {
    id: `offer-${timestamp}`,
    sellerId: testSeller.id,
    fiatCurrency: 'JPY',
    minAmountUsd: 10,
    maxAmountUsd: 1000,
    exchangeRateMargin: 5,
    paymentMethod: 'BANK_TRANSFER' as const,
    isActive: true,
  };

  const testTrade = {
    id: `trade-${timestamp}`,
    buyerId: testBuyer.id,
    sellerId: testSeller.id,
    amountUsd: 100,
    fiatCurrency: 'JPY',
    fiatAmount: 15750,
    exchangeRate: 157.5,
    status: 'PENDING' as const,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };

  beforeAll(async () => {
    // WalletNotificationServiceをモック
    mockNotificationService = {
      notifyP2PTradeCreated: vi.fn().mockResolvedValue(undefined),
      notifyP2PTradeMatched: vi.fn().mockResolvedValue(undefined),
      notifyP2PPaymentSent: vi.fn().mockResolvedValue(undefined),
      notifyP2PTradeCompleted: vi.fn().mockResolvedValue(undefined),
      notifyP2PTradeCancelled: vi.fn().mockResolvedValue(undefined),
      notifyP2PTradeTimeout: vi.fn().mockResolvedValue(undefined),
    };

    // WalletNotificationService.getInstanceをモック
    vi.spyOn(WalletNotificationService, 'getInstance').mockReturnValue(mockNotificationService);

    // P2PTradeServiceを初期化
    p2pTradeService = new P2PTradeService(prisma);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    // ウォレットをクリア
    await prisma.wallet.deleteMany();
    await prisma.walletTransaction.deleteMany();

    // テスト用データを設定
    await prisma.user.create({
      data: {
        ...testBuyer,
        passwordHash: '$2b$10$hashed_password',
        isActive: true,
        isVerified: true,
      },
    });

    await prisma.user.create({
      data: {
        ...testSeller,
        passwordHash: '$2b$10$hashed_password',
        isActive: true,
        isVerified: true,
      },
    });

    // ウォレットを作成
    await prisma.wallet.create({
      data: {
        userId: testBuyer.id,
        p2pBalanceUsd: 0,
        p2pLockedUsd: 0,
        balanceUsd: 0,
      },
    });

    await prisma.wallet.create({
      data: {
        userId: testSeller.id,
        p2pBalanceUsd: 200,
        p2pLockedUsd: 0,
        balanceUsd: 0,
      },
    });

    await prisma.p2POffer.create({
      data: testOffer,
    });
  });

  afterEach(async () => {
    // テストデータをクリーンアップ
    await prisma.p2PTradeRequest.deleteMany();
    await prisma.p2POffer.deleteMany();
    await prisma.walletTransaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.user.deleteMany();

    // モックをクリア
    vi.clearAllMocks();
  });

  describe('✅ 正常フロー', () => {
    it('取引リクエストを作成できる（オファーID指定）', async () => {
      // Arrange
      const amountUsd = 100;
      const fiatCurrency = 'JPY';
      const paymentMethod = 'BANK_TRANSFER';

      // Act
      const result = await p2pTradeService.createTradeRequest(
        testBuyer.id,
        amountUsd,
        fiatCurrency,
        paymentMethod,
        testOffer.id
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.buyerId).toBe(testBuyer.id);
      expect(result.sellerId).toBe(testSeller.id);
      expect(result.amountUsd).toBe(amountUsd);
      expect(result.status).toBe('PENDING');
      expect(result.expiresAt).toBeInstanceOf(Date);

      // 通知が送信されたことを確認
      expect(mockNotificationService.notifyP2PTradeCreated).toHaveBeenCalledWith(
        testBuyer.id,
        result.id,
        amountUsd,
        fiatCurrency,
        expect.any(Number)
      );
    });

    it('取引リクエストを作成できる（オファー自動マッチング）', async () => {
      // Arrange
      const amountUsd = 100;
      const fiatCurrency = 'JPY';
      const paymentMethod = 'BANK_TRANSFER';

      // Act
      const result = await p2pTradeService.createTradeRequest(
        testBuyer.id,
        amountUsd,
        fiatCurrency,
        paymentMethod
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.buyerId).toBe(testBuyer.id);
      expect(result.sellerId).toBe(testSeller.id);
      expect(result.amountUsd).toBe(amountUsd);
      expect(result.status).toBe('PENDING');

      // 通知が送信されたことを確認
      expect(mockNotificationService.notifyP2PTradeCreated).toHaveBeenCalled();
    });

    it('オファーを承認できる', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          offerId: testOffer.id,
        },
      });

      const paymentDetails = {
        bankName: 'Test Bank',
        accountNumber: '1234567890',
      };

      // Act
      const result = await p2pTradeService.acceptTradeRequest(
        trade.id,
        testSeller.id,
        paymentDetails
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('MATCHED');
      expect(result.paymentDetails).toBeDefined();

      // 通知が送信されたことを確認
      expect(mockNotificationService.notifyP2PTradeMatched).toHaveBeenCalledWith(
        testBuyer.id,
        trade.id,
        testSeller.displayName
      );
    });

    it('支払い完了をマークできる', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'MATCHED',
        },
      });

      // Act
      const result = await p2pTradeService.markPaymentSent(trade.id, testBuyer.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('PAYMENT_SENT');

      // 通知が送信されたことを確認
      expect(mockNotificationService.notifyP2PPaymentSent).toHaveBeenCalledWith(
        testSeller.id,
        trade.id,
        testBuyer.displayName
      );
    });

    it('支払い受領を確認できる', async () => {
      // Arrange
      // 売り手のウォレットを作成
      await prisma.wallet.create({
        data: {
          userId: testSeller.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 100,
          balanceUsd: 0,
        },
      });

      // 買い手のウォレットを作成
      await prisma.wallet.create({
        data: {
          userId: testBuyer.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 0,
          balanceUsd: 0,
        },
      });

      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'PAYMENT_SENT',
          escrowAmount: 100,
        },
      });

      // Act
      const result = await p2pTradeService.confirmPaymentReceived(trade.id, testSeller.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('CONFIRMED');
      expect(result.completedAt).toBeInstanceOf(Date);

      // 通知が送信されたことを確認
      expect(mockNotificationService.notifyP2PTradeCompleted).toHaveBeenCalledWith(
        testBuyer.id,
        trade.id,
        testTrade.amountUsd
      );
    });

    it('取引をキャンセルできる', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: testTrade,
      });

      // Act
      const result = await p2pTradeService.cancelTradeRequest(trade.id, testBuyer.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('CANCELLED');

      // 通知が送信されたことを確認
      expect(mockNotificationService.notifyP2PTradeCancelled).toHaveBeenCalledWith(
        testBuyer.id,
        trade.id,
        '取引がキャンセルされました'
      );
    });

    it('期限切れの取引をキャンセルできる', async () => {
      // Arrange
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000); // 1時間前

      await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          expiresAt: expiredDate,
          status: 'PENDING',
        },
      });

      await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          id: `trade-expired2-${timestamp}`,
          expiresAt: expiredDate,
          status: 'MATCHED',
        },
      });

      // Act
      const count = await p2pTradeService.cancelExpiredTrades();

      // Assert
      expect(count).toBe(2);
    });
  });

  describe('🔍 バリデーション', () => {
    it('存在しないオファーIDで取引を作成できない', async () => {
      // Arrange
      const nonExistentOfferId = 'non-existent-offer-id';

      // Act & Assert
      await expect(
        p2pTradeService.createTradeRequest(
          testBuyer.id,
          100,
          'JPY',
          'BANK_TRANSFER',
          nonExistentOfferId
        )
      ).rejects.toThrow('オファーが見つからないか、非アクティブです');
    });

    it('非アクティブなオファーで取引を作成できない', async () => {
      // Arrange
      const inactiveOffer = await prisma.p2POffer.create({
        data: {
          ...testOffer,
          id: `offer-inactive-${timestamp}`,
          paymentMethod: 'BANK_TRANSFER',
          isActive: false,
        },
      });

      // Act & Assert
      await expect(
        p2pTradeService.createTradeRequest(
          testBuyer.id,
          100,
          'JPY',
          'BANK_TRANSFER',
          inactiveOffer.id
        )
      ).rejects.toThrow('オファーが見つからないか、非アクティブです');
    });

    it('金額範囲外で取引を作成できない', async () => {
      // Arrange
      const amountBelowMin = 5; // minAmountUsdは10
      const amountAboveMax = 2000; // maxAmountUsdは1000

      // Act & Assert
      await expect(
        p2pTradeService.createTradeRequest(
          testBuyer.id,
          amountBelowMin,
          'JPY',
          'BANK_TRANSFER',
          testOffer.id
        )
      ).rejects.toThrow('金額が範囲外です');

      await expect(
        p2pTradeService.createTradeRequest(
          testBuyer.id,
          amountAboveMax,
          'JPY',
          'BANK_TRANSFER',
          testOffer.id
        )
      ).rejects.toThrow('金額が範囲外です');
    });

    it('利用可能なオファーがない場合はエラー', async () => {
      // Arrange
      await prisma.p2POffer.deleteMany();

      // Act & Assert
      await expect(
        p2pTradeService.createTradeRequest(testBuyer.id, 100, 'EUR', 'BANK_TRANSFER')
      ).rejects.toThrow('利用可能なオファーが見つかりません');
    });
  });

  describe('🔄 ステータス変更', () => {
    it('PENDINGからMATCHEDに変更できる', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'PENDING',
          offerId: testOffer.id,
        },
      });

      const paymentDetails = { bankName: 'Test Bank' };

      // Act
      const result = await p2pTradeService.acceptTradeRequest(
        trade.id,
        testSeller.id,
        paymentDetails
      );

      // Assert
      expect(result.status).toBe('MATCHED');
    });

    it('MATCHEDからPAYMENT_SENTに変更できる', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'MATCHED',
        },
      });

      // Act
      const result = await p2pTradeService.markPaymentSent(trade.id, testBuyer.id);

      // Assert
      expect(result.status).toBe('PAYMENT_SENT');
    });

    it('PAYMENT_SENTからCONFIRMEDに変更できる', async () => {
      // Arrange
      // ウォレットを作成
      await prisma.wallet.create({
        data: {
          userId: testSeller.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 100,
          balanceUsd: 0,
        },
      });

      await prisma.wallet.create({
        data: {
          userId: testBuyer.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 0,
          balanceUsd: 0,
        },
      });

      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'PAYMENT_SENT',
          escrowAmount: 100,
        },
      });

      // Act
      const result = await p2pTradeService.confirmPaymentReceived(trade.id, testSeller.id);

      // Assert
      expect(result.status).toBe('CONFIRMED');
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('任意のステータスからCANCELLEDに変更できる', async () => {
      // Arrange
      const statuses = ['PENDING', 'MATCHED', 'PAYMENT_SENT'];

      for (const status of statuses) {
        const trade = await prisma.p2PTradeRequest.create({
          data: {
            ...testTrade,
            id: `trade-${status}-${timestamp}`,
            status: status as 'PENDING' | 'MATCHED' | 'PAYMENT_SENT',
          },
        });

        // Act
        const result = await p2pTradeService.cancelTradeRequest(trade.id, testBuyer.id);

        // Assert
        expect(result.status).toBe('CANCELLED');
      }
    });
  });

  describe('🚫 エラーハンドリング', () => {
    it('存在しない取引をキャンセルできない', async () => {
      // Arrange
      const nonExistentTradeId = 'non-existent-trade-id';

      // Act & Assert
      await expect(
        p2pTradeService.cancelTradeRequest(nonExistentTradeId, testBuyer.id)
      ).rejects.toThrow('取引が見つかりません');
    });

    it('権限のないユーザーが取引をキャンセルできない', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: testTrade,
      });

      const unauthorizedUserId = 'unauthorized-user-id';

      // Act & Assert
      await expect(
        p2pTradeService.cancelTradeRequest(trade.id, unauthorizedUserId)
      ).rejects.toThrow('この取引をキャンセルする権限がありません');
    });

    it('買い手以外が支払い完了をマークできない', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'MATCHED',
        },
      });

      // Act & Assert
      await expect(p2pTradeService.markPaymentSent(trade.id, testSeller.id)).rejects.toThrow(
        'この操作は買い手のみ可能です'
      );
    });

    it('売り手以外が支払い受領を確認できない', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'PAYMENT_SENT',
        },
      });

      // Act & Assert
      await expect(p2pTradeService.confirmPaymentReceived(trade.id, testBuyer.id)).rejects.toThrow(
        'この操作は売り手のみ可能です'
      );
    });

    it('無効なステータス遷移はエラー', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'PENDING',
        },
      });

      // Act & Assert
      await expect(p2pTradeService.markPaymentSent(trade.id, testBuyer.id)).rejects.toThrow(
        'オファーが承認されていません'
      );

      await expect(p2pTradeService.confirmPaymentReceived(trade.id, testSeller.id)).rejects.toThrow(
        '支払いが完了していません'
      );
    });

    it('CONFIRMED状態の取引はキャンセルできない', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'CONFIRMED',
        },
      });

      // Act & Assert
      await expect(p2pTradeService.cancelTradeRequest(trade.id, testBuyer.id)).rejects.toThrow(
        'この取引はキャンセルできません'
      );
    });

    it('売り手以外がオファーを承認できない', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'PENDING',
          offerId: testOffer.id,
        },
      });

      const unauthorizedUserId = 'unauthorized-seller-id';

      // Act & Assert
      await expect(
        p2pTradeService.acceptTradeRequest(trade.id, unauthorizedUserId, {})
      ).rejects.toThrow('認証されていません');
    });

    it('PENDING以外の状態でオファーを承認できない', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'MATCHED',
          offerId: testOffer.id,
        },
      });

      // Act & Assert
      await expect(p2pTradeService.acceptTradeRequest(trade.id, testSeller.id, {})).rejects.toThrow(
        '取引リクエストは保留状態ではありません'
      );
    });
  });

  describe('💰 エスクロー操作', () => {
    it('エスクローを作成できる', async () => {
      // Arrange
      const amount = 100;
      const tradeId = 'test-trade-id';

      await prisma.wallet.create({
        data: {
          userId: testSeller.id,
          p2pBalanceUsd: 200,
          p2pLockedUsd: 0,
          balanceUsd: 0,
        },
      });

      // Act
      await p2pTradeService.createEscrow(testSeller.id, amount, tradeId);

      // Assert
      const wallet = await prisma.wallet.findUnique({
        where: { userId: testSeller.id },
      });

      expect(wallet).toBeDefined();
      expect(Number(wallet!.p2pBalanceUsd)).toBe(100);
      expect(Number(wallet!.p2pLockedUsd)).toBe(100);

      // トランザクションが作成されたことを確認
      const transaction = await prisma.walletTransaction.findFirst({
        where: {
          userId: testSeller.id,
          type: 'TRANSFER',
        },
      });

      expect(transaction).toBeDefined();
      expect(Number(transaction!.amountUsd)).toBe(-amount);
    });

    it('P2P残高が不足している場合エスクローを作成できない', async () => {
      // Arrange
      const amount = 200;
      const tradeId = 'test-trade-id';

      await prisma.wallet.create({
        data: {
          userId: testSeller.id,
          p2pBalanceUsd: 100, // 不足
          p2pLockedUsd: 0,
          balanceUsd: 0,
        },
      });

      // Act & Assert
      await expect(p2pTradeService.createEscrow(testSeller.id, amount, tradeId)).rejects.toThrow(
        'P2P残高が不足しています'
      );
    });

    it('エスクローを解放できる', async () => {
      // Arrange
      const amount = 100;
      const tradeId = 'test-trade-id';

      await prisma.wallet.create({
        data: {
          userId: testSeller.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 100,
          balanceUsd: 0,
        },
      });

      await prisma.wallet.create({
        data: {
          userId: testBuyer.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 0,
          balanceUsd: 0,
        },
      });

      // Act
      await p2pTradeService.releaseEscrow(testBuyer.id, testSeller.id, amount, tradeId);

      // Assert
      const sellerWallet = await prisma.wallet.findUnique({
        where: { userId: testSeller.id },
      });

      const buyerWallet = await prisma.wallet.findUnique({
        where: { userId: testBuyer.id },
      });

      expect(Number(sellerWallet!.p2pLockedUsd)).toBe(0);
      expect(Number(buyerWallet!.p2pBalanceUsd)).toBe(100);
    });

    it('エスクローをキャンセルできる', async () => {
      // Arrange
      const amount = 100;
      const tradeId = 'test-trade-id';

      await prisma.wallet.create({
        data: {
          userId: testSeller.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 100,
          balanceUsd: 0,
        },
      });

      // Act
      await p2pTradeService.cancelEscrow(testSeller.id, amount, tradeId);

      // Assert
      const wallet = await prisma.wallet.findUnique({
        where: { userId: testSeller.id },
      });

      expect(wallet).toBeDefined();
      expect(Number(wallet!.p2pBalanceUsd)).toBe(100);
      expect(Number(wallet!.p2pLockedUsd)).toBe(0);
    });

    it('ロック残高が不足している場合エスクローを解放できない', async () => {
      // Arrange
      const amount = 200;
      const tradeId = 'test-trade-id';

      await prisma.wallet.create({
        data: {
          userId: testSeller.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 100, // 不足
          balanceUsd: 0,
        },
      });

      await prisma.wallet.create({
        data: {
          userId: testBuyer.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 0,
          balanceUsd: 0,
        },
      });

      // Act & Assert
      await expect(
        p2pTradeService.releaseEscrow(testBuyer.id, testSeller.id, amount, tradeId)
      ).rejects.toThrow('ロック残高が不足しています');
    });
  });

  describe('📊 通知送信', () => {
    it('取引作成時に通知が送信される', async () => {
      // Arrange
      const amountUsd = 100;

      // Act
      await p2pTradeService.createTradeRequest(
        testBuyer.id,
        amountUsd,
        'JPY',
        'BANK_TRANSFER',
        testOffer.id
      );

      // Assert
      expect(mockNotificationService.notifyP2PTradeCreated).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyP2PTradeCreated).toHaveBeenCalledWith(
        testBuyer.id,
        expect.any(String),
        amountUsd,
        'JPY',
        expect.any(Number)
      );
    });

    it('オファー承認時に通知が送信される', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          offerId: testOffer.id,
        },
      });

      // Act
      await p2pTradeService.acceptTradeRequest(trade.id, testSeller.id, {});

      // Assert
      expect(mockNotificationService.notifyP2PTradeMatched).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyP2PTradeMatched).toHaveBeenCalledWith(
        testBuyer.id,
        trade.id,
        testSeller.displayName
      );
    });

    it('支払い送信時に通知が送信される', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'MATCHED',
        },
      });

      // Act
      await p2pTradeService.markPaymentSent(trade.id, testBuyer.id);

      // Assert
      expect(mockNotificationService.notifyP2PPaymentSent).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyP2PPaymentSent).toHaveBeenCalledWith(
        testSeller.id,
        trade.id,
        testBuyer.displayName
      );
    });

    it('取引完了時に通知が送信される', async () => {
      // Arrange
      await prisma.wallet.create({
        data: {
          userId: testSeller.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 100,
          balanceUsd: 0,
        },
      });

      await prisma.wallet.create({
        data: {
          userId: testBuyer.id,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 0,
          balanceUsd: 0,
        },
      });

      const trade = await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          status: 'PAYMENT_SENT',
          escrowAmount: 100,
        },
      });

      // Act
      await p2pTradeService.confirmPaymentReceived(trade.id, testSeller.id);

      // Assert
      expect(mockNotificationService.notifyP2PTradeCompleted).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyP2PTradeCompleted).toHaveBeenCalledWith(
        testBuyer.id,
        trade.id,
        testTrade.amountUsd
      );
    });

    it('取引キャンセル時に通知が送信される', async () => {
      // Arrange
      const trade = await prisma.p2PTradeRequest.create({
        data: testTrade,
      });

      // Act
      await p2pTradeService.cancelTradeRequest(trade.id, testBuyer.id);

      // Assert
      expect(mockNotificationService.notifyP2PTradeCancelled).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyP2PTradeCancelled).toHaveBeenCalledWith(
        testBuyer.id,
        trade.id,
        '取引がキャンセルされました'
      );
    });

    it('期限切れ時にタイムアウト通知が送信される', async () => {
      // Arrange
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000);

      await prisma.p2PTradeRequest.create({
        data: {
          ...testTrade,
          expiresAt: expiredDate,
          status: 'PENDING',
        },
      });

      // Act
      await p2pTradeService.cancelExpiredTrades();

      // Assert
      expect(mockNotificationService.notifyP2PTradeTimeout).toHaveBeenCalled();
    });
  });

  describe('💱 為替レート', () => {
    it('為替レートを取得できる', async () => {
      // Act
      const rate = await p2pTradeService.getExchangeRate('JPY');

      // Assert
      expect(rate).toBeDefined();
      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThan(0);
    });

    it('フォールバック為替レートが使用される', async () => {
      // Act
      const jpyRate = await p2pTradeService.getExchangeRate('JPY');
      const usdRate = await p2pTradeService.getExchangeRate('USD');
      const eurRate = await p2pTradeService.getExchangeRate('EUR');

      // Assert
      expect(jpyRate).toBe(150.0);
      expect(usdRate).toBe(1.0);
      expect(eurRate).toBe(0.92);
    });

    it('未知の通貨の場合はデフォルトレートが使用される', async () => {
      // Act
      const rate = await p2pTradeService.getExchangeRate('XYZ');

      // Assert
      expect(rate).toBe(1.0);
    });
  });

  describe('🔍 オファーマッチング', () => {
    it('最適なオファーをマッチングできる', async () => {
      // Arrange
      await prisma.p2POffer.create({
        data: {
          ...testOffer,
          id: `offer-1-${timestamp}`,
          paymentMethod: 'BANK_TRANSFER',
          exchangeRateMargin: 10, // マージンが高い
        },
      });

      const offer2 = await prisma.p2POffer.create({
        data: {
          ...testOffer,
          id: `offer-2-${timestamp}`,
          paymentMethod: 'BANK_TRANSFER',
          exchangeRateMargin: 3, // マージンが低い（最適）
        },
      });

      await prisma.p2POffer.create({
        data: {
          ...testOffer,
          id: `offer-3-${timestamp}`,
          paymentMethod: 'BANK_TRANSFER',
          exchangeRateMargin: 5,
        },
      });

      // Act
      const result = await p2pTradeService.matchOffer(100, 'JPY', 'BANK_TRANSFER');

      // Assert
      expect(result).toBeDefined();
      expect(result!.offerId).toBe(offer2.id); // マージンが最も低いオファー
      expect(result!.sellerId).toBe(testSeller.id);
    });

    it('条件に一致するオファーがない場合はnullを返す', async () => {
      // Arrange
      await prisma.p2POffer.deleteMany();

      // Act
      const result = await p2pTradeService.matchOffer(100, 'EUR', 'PAYPAL');

      // Assert
      expect(result).toBeNull();
    });

    it('支払い方法でフィルタリングできる', async () => {
      // Arrange
      await prisma.p2POffer.deleteMany();

      await prisma.p2POffer.create({
        data: {
          ...testOffer,
          id: `offer-bank-${timestamp}`,
          paymentMethod: 'BANK_TRANSFER',
        },
      });

      await prisma.p2POffer.create({
        data: {
          ...testOffer,
          id: `offer-paypal-${timestamp}`,
          paymentMethod: 'PAYPAL',
        },
      });

      await prisma.p2POffer.create({
        data: {
          ...testOffer,
          id: `offer-bank-${timestamp}`,
          paymentMethod: 'BANK_TRANSFER',
        },
      });

      await prisma.p2POffer.create({
        data: {
          ...testOffer,
          id: `offer-paypal-${timestamp}`,
          paymentMethod: 'PAYPAL',
        },
      });

      // Act
      const result = await p2pTradeService.matchOffer(100, 'JPY', 'PAYPAL');

      // Assert
      expect(result).toBeDefined();
      expect(result!.offerId).toContain('paypal');
    });
  });
});
