/**
 * ランダム生成ユーティリティ
 * シードデータ作成で使用するランダム生成関数を提供
 */

/**
 * ランダムな日付を生成（過去30日以内）
 */
export function getRandomDate(): Date {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const randomTime =
    thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  return new Date(randomTime);
}

/**
 * 指定された範囲内のランダムな日付を生成
 */
export function getRandomDateInRange(startDate: Date, endDate: Date): Date {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * 配列からランダムな要素を選択
 */
export function getRandomElement<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('配列が空です');
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 配列から複数のランダムな要素を選択（重複なし）
 */
export function getRandomElements<T>(array: T[], count: number): T[] {
  if (count > array.length) {
    throw new Error('選択数が配列の長さを超えています');
  }

  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * 指定された範囲内のランダムな整数を生成
 */
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 指定された範囲内のランダムな浮動小数点数を生成
 */
export function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 指定された確率でtrueを返す
 */
export function getRandomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * ランダムな文字列を生成
 */
export function getRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * ランダムな16進数文字列を生成
 */
export function getRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 通貨に応じたランダムなウォレットアドレスを生成
 */
export function generateWalletAddress(currency: string): string {
  switch (currency) {
    case 'BTC':
      return `bc1q${getRandomString(39)}`;
    case 'ETH':
    case 'USDT':
    case 'BNB':
    case 'MATIC':
      return `0x${getRandomHex(40)}`;
    case 'ADA':
      return `addr1q${getRandomString(56)}`;
    case 'DOT':
      return `1${getRandomString(46)}`;
    case 'SOL':
      return getRandomString(43);
    case 'XRP':
      return `r${getRandomString(33)}`;
    case 'XMR':
      return `4${getRandomHex(94)}`;
    default:
      return getRandomString(42);
  }
}

/**
 * ランダムなファイルサイズを生成（バイト単位）
 */
export function getRandomFileSize(minKB: number, maxKB: number): number {
  return getRandomInt(minKB * 1024, maxKB * 1024);
}

/**
 * ランダムなS3キーを生成
 */
export function generateS3Key(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const randomSuffix = getRandomString(8);
  return `${prefix}/${timestamp}_${randomSuffix}.${extension}`;
}

/**
 * ランダムなトランザクションハッシュを生成
 */
export function generateTransactionHash(): string {
  return `0x${getRandomHex(64)}`;
}

/**
 * ランダムな外部IDを生成
 */
export function generateExternalId(prefix: string = 'ext'): string {
  return `${prefix}_${getRandomString(14)}`;
}

/**
 * 重み付きランダム選択
 */
export function getWeightedRandomElement<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error('アイテム数と重み数が一致しません');
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}
