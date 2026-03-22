/**
 * 🚀 NOWPayments REST API クライアント
 */

import fetch from 'node-fetch';
import { logger } from '@libark/core-shared';

import type {
  NOWPaymentsConfig,
  CreatePaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  CurrencyInfo,
  APIStatusResponse,
  MinAmountResponse,
  MaxAmountResponse,
  NOWPaymentsError,
  RequestOptions,
  CryptoCurrency,
  FiatCurrency,
  CryptoNetwork,
} from './types.js';

export class NOWPaymentsRestClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;
  constructor(config: NOWPaymentsConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.nowpayments.io/v1';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    logger.info('NOWPayments REST Client initialized', {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
    });
  }

  /**
   * 📡 HTTP リクエストを実行
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const maxRetries = options.retries || this.retryAttempts;
    let lastError: Error;

    // サンドボックス環境でAPIキーが空の場合はヘッダーから除外
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey && this.apiKey.trim() !== '') {
      headers['x-api-key'] = this.apiKey;
    }

    const requestOptions = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      timeout: options.timeout || this.timeout,
    };

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.debug('Making NOWPayments API request', {
          method,
          endpoint,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
        });

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          let errorData: NOWPaymentsError;
          try {
            errorData = (await response.json()) as NOWPaymentsError;
          } catch (parseError) {
            // JSONパースに失敗した場合のフォールバック
            errorData = {
              error: `HTTP ${response.status}`,
              message: response.statusText || 'Unknown error',
              statusCode: response.status,
            };
          }

          const errorMessage = `NOWPayments API Error: ${response.status} - ${errorData.message || errorData.error}`;
          logger.error('NOWPayments API Error Details', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            url,
            method,
          });

          throw new Error(errorMessage);
        }

        const data = (await response.json()) as T;

        logger.debug('NOWPayments API request successful', {
          method,
          endpoint,
          attempt: attempt + 1,
        });

        return data;
      } catch (error) {
        lastError = error as Error;

        logger.warn('NOWPayments API request failed', {
          method,
          endpoint,
          attempt: attempt + 1,
          error: lastError.message,
        });

        if (attempt < maxRetries) {
          const delay = (options.retryDelay || this.retryDelay) * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('NOWPayments API request failed after all retries', {
      method,
      endpoint,
      maxRetries: maxRetries + 1,
      error: lastError!.message,
    });

    throw lastError!;
  }

  /**
   * 🏥 API状態を確認
   */
  async getAPIStatus(): Promise<APIStatusResponse> {
    return this.makeRequest<APIStatusResponse>('GET', '/status');
  }

  /**
   * 💰 利用可能な通貨リストを取得
   */
  async getAvailableCurrencies(): Promise<CurrencyInfo[]> {
    const response = await this.makeRequest<{ currencies: string[] }>('GET', '/currencies');

    // NOWPayments APIは通貨ティッカーの配列を返すので、CurrencyInfo形式に変換
    return (response as { currencies: string[] }).currencies.map((ticker: string) => ({
      ticker: ticker.toUpperCase(),
      name: this.getCurrencyName(ticker),
      image: '',
      has_external_id: this.hasExternalId(ticker),
      isFiat: false,
      featured: this.isFeaturedCurrency(ticker),
      is_stable: this.isStableCurrency(ticker),
      supportsFixedRate: true,
      network: this.getDefaultNetwork(ticker) as CryptoNetwork,
      networks: this.getSupportedNetworks(ticker) as CryptoNetwork[],
    }));
  }

  /**
   * 🏪 マーチャント対応通貨リストを取得
   */
  async getMerchantCoins(): Promise<string[]> {
    const response = await this.makeRequest<{ selectedCurrencies: string[] }>(
      'GET',
      '/merchant/coins'
    );
    return (response as { selectedCurrencies?: string[] }).selectedCurrencies || [];
  }

  /**
   * 🪙 詳細な通貨情報を取得（full-currencies APIを使用）
   */
  async getFullCurrencies(): Promise<unknown> {
    return this.makeRequest<unknown>('GET', '/full-currencies');
  }

  /**
   * 通貨名を取得（NOWPayments APIティッカーから解析）
   */
  private getCurrencyName(ticker: string): string {
    const _lowerTicker = ticker.toLowerCase();
    const baseCurrency = this.getBaseCurrency(ticker);
    const network = this.getDefaultNetwork(ticker);

    // ベース通貨名のマッピング
    const baseNames: { [key: string]: string } = {
      btc: 'Bitcoin',
      eth: 'Ethereum',
      usdt: 'Tether',
      usdc: 'USD Coin',
      dai: 'Dai',
      busd: 'Binance USD',
      tusd: 'TrueUSD',
      usdd: 'USDD',
      ltc: 'Litecoin',
      xrp: 'Ripple',
      ada: 'Cardano',
      dot: 'Polkadot',
      matic: 'Polygon',
      bnb: 'Binance Coin',
      sol: 'Solana',
      avax: 'Avalanche',
      link: 'Chainlink',
      uni: 'Uniswap',
      atom: 'Cosmos',
      xlm: 'Stellar',
      doge: 'Dogecoin',
      shib: 'Shiba Inu',
      trx: 'TRON',
      wbtc: 'Wrapped Bitcoin',
      weth: 'Wrapped Ethereum',
      aave: 'Aave',
      sushi: 'SushiSwap',
      comp: 'Compound',
      mkr: 'Maker',
      snx: 'Synthetix',
      crv: 'Curve DAO Token',
      yfi: 'yearn.finance',
      algo: 'Algorand',
      ftm: 'Fantom',
      near: 'NEAR Protocol',
    };

    const baseName = baseNames[baseCurrency] || baseCurrency.toUpperCase();

    // ネットワーク固有の場合はネットワーク名を追加
    if (network !== baseCurrency.toUpperCase() && network !== ticker.toUpperCase()) {
      return `${baseName} (${network})`;
    }

    return baseName;
  }

  /**
   * 外部IDが必要な通貨かチェック
   */
  private hasExternalId(ticker: string): boolean {
    const externalIdCurrencies = ['xrp', 'xlm', 'eos'];
    return externalIdCurrencies.includes(ticker.toLowerCase());
  }

  /**
   * 人気通貨かチェック
   */
  private isFeaturedCurrency(ticker: string): boolean {
    const featured = [
      'btc',
      'eth',
      'usdttrc20',
      'usdterc20',
      'usdtbsc',
      'usdcbsc',
      'usdc',
      'ltc',
      'xrp',
      'ada',
      'dot',
      'matic',
      'bnbbsc',
    ];
    return featured.includes(ticker.toLowerCase());
  }

  /**
   * ステーブルコインかチェック
   */
  private isStableCurrency(ticker: string): boolean {
    const stableCoins = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdd'];
    return stableCoins.some(stable => ticker.toLowerCase().includes(stable));
  }

  /**
   * デフォルトネットワークを取得（NOWPayments APIティッカーから解析）
   */
  private getDefaultNetwork(ticker: string): string {
    const lowerTicker = ticker.toLowerCase();

    // ネットワーク識別子のマッピング
    const networkMappings = [
      { pattern: /trc20|tron/, network: 'TRC20' },
      { pattern: /bsc|bnb/, network: 'BSC' },
      { pattern: /erc20|eth$/, network: 'ETH' },
      { pattern: /matic|poly/, network: 'POLYGON' },
      { pattern: /arb|arbitrum/, network: 'ARBITRUM' },
      { pattern: /op|optimism/, network: 'OPTIMISM' },
      { pattern: /avax|avalanche/, network: 'AVALANCHE' },
      { pattern: /sol|solana/, network: 'SOLANA' },
      { pattern: /algo|algorand/, network: 'ALGORAND' },
      { pattern: /ftm|fantom/, network: 'FANTOM' },
      { pattern: /near/, network: 'NEAR' },
      { pattern: /ada|cardano/, network: 'CARDANO' },
      { pattern: /dot|polkadot/, network: 'POLKADOT' },
      { pattern: /atom|cosmos/, network: 'COSMOS' },
      { pattern: /xlm|stellar/, network: 'STELLAR' },
      { pattern: /xrp|ripple/, network: 'RIPPLE' },
      { pattern: /ltc|litecoin/, network: 'LITECOIN' },
      { pattern: /btc|bitcoin/, network: 'BITCOIN' },
      { pattern: /doge|dogecoin/, network: 'DOGECOIN' },
      { pattern: /trx|tron/, network: 'TRON' },
    ];

    for (const mapping of networkMappings) {
      if (mapping.pattern.test(lowerTicker)) {
        return mapping.network;
      }
    }

    return ticker.toUpperCase();
  }

  /**
   * サポートされているネットワークを取得（NOWPayments APIから推定）
   */
  private getSupportedNetworks(ticker: string): string[] {
    const lowerTicker = ticker.toLowerCase();
    const baseCurrency = this.getBaseCurrency(ticker);

    // 特定のネットワークが明示されている場合は単一ネットワーク
    const networkSpecific = [
      'trc20',
      'bsc',
      'erc20',
      'matic',
      'poly',
      'arb',
      'arbitrum',
      'op',
      'optimism',
      'avax',
      'avalanche',
      'sol',
      'solana',
      'algo',
      'ftm',
      'fantom',
      'near',
      'ada',
      'dot',
      'atom',
      'xlm',
      'xrp',
    ];

    if (networkSpecific.some(network => lowerTicker.includes(network))) {
      return [this.getDefaultNetwork(ticker)];
    }

    // ベース通貨に基づいてマルチネットワーク対応を判定
    const multiNetworkCurrencies: { [key: string]: string[] } = {
      usdt: ['ETH', 'TRC20', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVALANCHE'],
      usdc: ['ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVALANCHE', 'ALGORAND'],
      dai: ['ETH', 'BSC', 'POLYGON'],
      busd: ['ETH', 'BSC'],
      wbtc: ['ETH', 'BSC', 'POLYGON'],
      weth: ['ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM'],
      link: ['ETH', 'BSC', 'POLYGON'],
      uni: ['ETH', 'BSC', 'POLYGON'],
      aave: ['ETH', 'BSC', 'POLYGON'],
      sushi: ['ETH', 'BSC', 'POLYGON'],
    };

    return multiNetworkCurrencies[baseCurrency] || [this.getDefaultNetwork(ticker)];
  }

  /**
   * ティッカーからベース通貨を抽出
   */
  private getBaseCurrency(ticker: string): string {
    const lowerTicker = ticker.toLowerCase();

    // ネットワーク識別子を除去してベース通貨を取得
    const networkSuffixes = [
      'trc20',
      'bsc',
      'erc20',
      'matic',
      'poly',
      'arb',
      'arbitrum',
      'op',
      'optimism',
      'avax',
      'avalanche',
      'sol',
      'solana',
      'algo',
      'ftm',
      'fantom',
      'near',
    ];

    let baseCurrency = lowerTicker;
    for (const suffix of networkSuffixes) {
      baseCurrency = baseCurrency.replace(suffix, '');
    }

    return baseCurrency;
  }

  /**
   * 💵 最小決済額を取得
   * @param currencyFrom ユーザーが支払う通貨（暗号通貨）
   * @param currencyTo 受取通貨（通常はUSD）
   */
  async getMinAmount(
    currencyFrom: CryptoCurrency,
    currencyTo: FiatCurrency
  ): Promise<MinAmountResponse> {
    return this.makeRequest<MinAmountResponse>(
      'GET',
      `/min-amount?currency_from=${currencyFrom.toLowerCase()}&currency_to=${currencyTo.toLowerCase()}`
    );
  }

  /**
   * 💰 最大決済額を取得（NOWPayments APIにmax-amountエンドポイントは存在しないため、実用的な制限値を返す）
   */
  async getMaxAmount(currencyFrom: string, currencyTo: string): Promise<MaxAmountResponse> {
    // NOWPayments APIには最大額制限がないため、実用的な制限値を設定
    // 通貨に応じて適切な最大額を設定
    const maxAmounts: Record<string, number> = {
      BTC: 100000, // $100,000
      ETH: 100000, // $100,000
      USDT: 50000, // $50,000
      USDTBSC: 50000, // $50,000
      USDC: 50000, // $50,000
      BNB: 50000, // $50,000
      AAVE: 50000, // $50,000
      DOGE: 25000, // $25,000
      LTC: 50000, // $50,000
      ADA: 25000, // $25,000
      DOT: 25000, // $25,000
      MATIC: 25000, // $25,000
      AVAX: 25000, // $25,000
      SOL: 50000, // $50,000
      TRX: 25000, // $25,000
    };

    const maxAmount = maxAmounts[currencyFrom.toUpperCase()] || 25000; // デフォルト$25,000

    logger.info('Using practical max amount limit', {
      currencyFrom,
      currencyTo,
      maxAmount,
    });

    return {
      currency_from: currencyFrom as FiatCurrency,
      currency_to: currencyTo as CryptoCurrency,
      max_amount: maxAmount,
    };
  }

  /**
   * 💳 決済を作成
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    logger.info('Creating payment', {
      orderId: request.order_id,
      amount: request.price_amount,
      currency: request.price_currency,
      payCurrency: request.pay_currency,
    });

    return this.makeRequest<PaymentResponse>('POST', '/payment', request);
  }

  /**
   * 📊 決済状態を取得
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    return this.makeRequest<PaymentStatusResponse>('GET', `/payment/${paymentId}`);
  }

  /**
   * 📋 決済リストを取得
   */
  async getPayments(
    limit: number = 10,
    page: number = 0,
    sortBy: string = 'created_at',
    orderBy: 'asc' | 'desc' = 'desc'
  ): Promise<PaymentStatusResponse[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      sortBy,
      orderBy,
    });

    return this.makeRequest<PaymentStatusResponse[]>('GET', `/payment?${params}`);
  }

  /**
   * 💱 為替レートを取得
   */
  async getExchangeRate(currencyFrom: string, currencyTo: string, amount?: number) {
    const params = new URLSearchParams({
      currency_from: currencyFrom.toLowerCase(),
      currency_to: currencyTo.toLowerCase(),
    });

    if (amount) {
      params.append('amount', amount.toString());
    }

    return this.makeRequest('GET', `/estimate?${params.toString()}`);
  }
}
