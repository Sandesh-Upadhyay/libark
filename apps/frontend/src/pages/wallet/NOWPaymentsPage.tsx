/**
 * 🎯 NOWPayments決済ページ
 *
 * 責任:
 * - NOWPayments APIを使用した暗号通貨決済フロー
 * - リアルタイム決済状態更新
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Motion } from '@/components/atoms';
import { Button } from '@/components/atoms';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { DepositForm } from '@/features/wallet/components/molecules';

// クレジットカード入金専用ページ - 暗号通貨選択機能は削除

type PaymentStep = 'setup' | 'completed';

/**
 * 🎯 クレジットカード入金ページコンポーネント
 */
const NOWPaymentsPage: React.FC = () => {
  const navigate = useNavigate();

  // ステップ管理
  const [step, setStep] = useState<PaymentStep>('setup');

  // フォーム状態（クレジットカード入金用）
  const [formState, setFormState] = useState({
    usdAmount: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  // クレジットカード入金専用 - 不要な機能は削除

  // フォーム状態の更新
  const updateFormState = useCallback((updates: Partial<typeof formState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  // 分割代入
  const { usdAmount } = formState;

  // 戻るボタン
  const _handleBack = () => {
    if (step === 'setup') {
      navigate('/wallet');
    } else {
      setStep('setup');
    }
  };

  // クレジットカード決済作成
  const handleCreatePayment = async () => {
    try {
      setIsLoading(true);

      // クレジットカード決済の場合、外部決済プロバイダーにリダイレクト
      toast.info('決済プロバイダーにリダイレクトしています...');

      // 実際の実装では、決済プロバイダーのAPIを呼び出し
      // ここでは模擬的な処理を行う
      setTimeout(() => {
        toast.success('クレジットカード決済が完了しました');
        setStep('completed');
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Card payment failed:', error);
      toast.error('クレジットカード決済に失敗しました');
      setStep('setup');
      setIsLoading(false);
    }
  };

  // クレジットカード入金専用 - テストケース機能は不要

  // クレジットカード入金専用 - テストケース機能は不要

  // フィルタリングされた通貨リスト
  // クレジットカード入金専用 - 暗号通貨選択機能は不要

  // クレジットカード入金専用 - 不要な機能は削除

  return (
    <div className='space-y-6'>
      {/* 統一ページヘッダー */}
      <div className='p-4 border rounded-lg'>
        <h1 className='text-xl font-bold'>クレジットカード入金</h1>
        <p className='text-muted-foreground'>暗号通貨決済</p>
      </div>

      <Motion.div preset='slideUp' delay={0.1}>
        <div className='space-y-6'>
          {step === 'setup' && (
            <div className='space-y-6'>
              {/* クレジットカード入金説明 */}
              <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6'>
                <div className='flex items-start space-x-3'>
                  <CreditCard className='h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
                  <div>
                    <h3 className='font-semibold text-blue-800 dark:text-blue-200 mb-2'>
                      クレジットカード入金
                    </h3>
                    <span className='text-sm text-blue-700 dark:text-blue-300 mb-4'>
                      クレジットカードを使用して暗号通貨を購入し、ウォレットに入金できます。
                    </span>
                    <div className='space-y-2'>
                      <div className='flex items-center text-sm text-blue-700 dark:text-blue-300'>
                        <CheckCircle className='h-4 w-4 mr-2' />
                        Visa、Mastercard対応
                      </div>
                      <div className='flex items-center text-sm text-blue-700 dark:text-blue-300'>
                        <CheckCircle className='h-4 w-4 mr-2' />
                        即座に残高反映
                      </div>
                      <div className='flex items-center text-sm text-blue-700 dark:text-blue-300'>
                        <CheckCircle className='h-4 w-4 mr-2' />
                        セキュアな決済処理
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 金額入力 */}
              <div className='space-y-3'>
                <span className='text-lg font-semibold'>購入金額を入力</span>
                <DepositForm
                  minAmount={10}
                  maxAmount={10000}
                  currency='USD'
                  title=''
                  description='クレジットカードで購入したい金額をUSDで入力してください'
                  limitsLoading={false}
                  limitsError={null}
                  onSubmit={amount => updateFormState({ usdAmount: amount.toString() })}
                />
              </div>

              {/* 購入ボタン */}
              <div className='space-y-3'>
                <Button
                  onClick={handleCreatePayment}
                  disabled={
                    !usdAmount ||
                    !usdAmount.trim() ||
                    parseFloat(usdAmount) <= 0 ||
                    parseFloat(usdAmount) < 10 ||
                    parseFloat(usdAmount) > 10000
                  }
                  variant='default'
                  size='lg'
                  className='w-full'
                >
                  <CreditCard className='mr-2 h-4 w-4' />
                  {isLoading ? '処理中...' : 'クレジットカードで購入'}
                </Button>
              </div>

              {/* 注意事項 */}
              <div className='bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4'>
                <div className='flex items-start space-x-3'>
                  <AlertTriangle className='h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5' />
                  <div>
                    <h4 className='font-medium text-orange-800 dark:text-orange-200 mb-2'>
                      ご注意
                    </h4>
                    <ul className='text-sm text-orange-700 dark:text-orange-300 space-y-1'>
                      <li>• 最低購入額: $10</li>
                      <li>• 最高購入額: $10,000</li>
                      <li>• 決済手数料が別途かかります</li>
                      <li>• 購入した暗号通貨は即座にウォレットに反映されます</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'completed' && (
            <div className='space-y-6'>
              {/* クレジットカード決済完了画面 */}
              <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center'>
                <CheckCircle className='h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-green-800 dark:text-green-200 mb-2'>
                  決済が完了しました！
                </h3>
                <span className='text-green-700 dark:text-green-300 mb-4'>
                  クレジットカードでの購入が正常に処理されました。
                </span>
                <div className='space-y-2'>
                  <span className='text-sm text-green-600 dark:text-green-400'>
                    購入金額: ${usdAmount}
                  </span>
                  <span className='text-sm text-green-600 dark:text-green-400'>
                    暗号通貨がウォレットに追加されました
                  </span>
                </div>
              </div>

              {/* 次のアクション */}
              <div className='flex gap-4'>
                <Button onClick={() => navigate('/wallet')} variant='default' className='flex-1'>
                  ウォレットを確認
                </Button>
                <Button
                  onClick={() => {
                    setStep('setup');
                    setFormState({ usdAmount: '' });
                  }}
                  variant='outline'
                  className='flex-1'
                >
                  再度購入
                </Button>
              </div>
            </div>
          )}
        </div>
      </Motion.div>
    </div>
  );
};

export default NOWPaymentsPage;
