/**
 * 本番環境用決済プロバイダーデータ
 * 暗号通貨決済システムの設定
 */

export interface PaymentProviderData {
  name: string;
  displayName: string;
  type: 'CRYPTO_DEPOSIT' | 'CRYPTO_WITHDRAWAL' | 'P2P';
  isActive: boolean;
  config: Record<string, any>;
}

/**
 * 本番環境用決済プロバイダー設定
 * 注意: 実際のAPI キーは環境変数で管理
 */
export const PRODUCTION_PAYMENT_PROVIDERS: PaymentProviderData[] = [
  {
    name: 'nowpayments',
    displayName: 'NOWPayments',
    type: 'CRYPTO_DEPOSIT',
    isActive: true,
    config: {
      apiUrl: 'https://api.nowpayments.io/v1',
      supportedCurrencies: [
        'BTC',
        'ETH',
        'USDT',
        'BNB',
        'ADA',
        'DOT',
        'MATIC',
        'SOL',
        'XRP',
        'XMR',
      ],
      minAmount: {
        BTC: 0.0001,
        ETH: 0.001,
        USDT: 1.0,
        BNB: 0.01,
        ADA: 1.0,
        DOT: 0.1,
        MATIC: 1.0,
        SOL: 0.01,
        XRP: 1.0,
        XMR: 0.01,
      },
      maxAmount: {
        BTC: 10.0,
        ETH: 100.0,
        USDT: 100000.0,
        BNB: 1000.0,
        ADA: 100000.0,
        DOT: 10000.0,
        MATIC: 100000.0,
        SOL: 1000.0,
        XRP: 100000.0,
        XMR: 1000.0,
      },
      confirmations: {
        BTC: 2,
        ETH: 12,
        USDT: 12,
        BNB: 15,
        ADA: 15,
        DOT: 10,
        MATIC: 30,
        SOL: 32,
        XRP: 3,
        XMR: 10,
      },
      webhookUrl: '/api/webhooks/nowpayments',
      callbackUrl: '/payment/callback',
    },
  },
  {
    name: 'mexc',
    displayName: 'MEXC Exchange',
    type: 'CRYPTO_WITHDRAWAL',
    isActive: true,
    config: {
      apiUrl: 'https://api.mexc.com/api/v3',
      supportedCurrencies: ['BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'DOT', 'MATIC', 'SOL', 'XRP'],
      minWithdrawal: {
        BTC: 0.001,
        ETH: 0.01,
        USDT: 10.0,
        BNB: 0.1,
        ADA: 10.0,
        DOT: 1.0,
        MATIC: 10.0,
        SOL: 0.1,
        XRP: 10.0,
      },
      withdrawalFee: {
        BTC: 0.0005,
        ETH: 0.005,
        USDT: 1.0,
        BNB: 0.005,
        ADA: 1.0,
        DOT: 0.1,
        MATIC: 1.0,
        SOL: 0.01,
        XRP: 0.25,
      },
      processingTime: '1-30分',
      dailyLimit: 100000.0, // USD
    },
  },
  {
    name: 'p2p_system',
    displayName: 'P2P Trading System',
    type: 'P2P',
    isActive: true,
    config: {
      supportedCurrencies: ['BTC', 'ETH', 'USDT'],
      escrowEnabled: true,
      disputeResolution: true,
      tradingFee: 0.005, // 0.5%
      minTradeAmount: {
        BTC: 0.001,
        ETH: 0.01,
        USDT: 10.0,
      },
      maxTradeAmount: {
        BTC: 1.0,
        ETH: 10.0,
        USDT: 10000.0,
      },
      escrowTimeout: 3600, // 1時間（秒）
      disputeTimeout: 86400, // 24時間（秒）
    },
  },
];
