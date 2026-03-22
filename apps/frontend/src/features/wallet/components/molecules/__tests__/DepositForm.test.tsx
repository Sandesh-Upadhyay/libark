import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import { DepositForm } from '../DepositForm';

describe('DepositForm', () => {
  const defaultProps = {
    minAmount: 10,
    maxAmount: 1000,
    currency: 'USD',
    onSubmit: vi.fn(),
  };

  it('正しくレンダリングされること', () => {
    render(<DepositForm {...defaultProps} />);
    expect(screen.getByLabelText(/金額 \(USD\)/)).toBeInTheDocument();
    expect(screen.getByText('最小: $10.00')).toBeInTheDocument();
    expect(screen.getByText('最大: $1,000')).toBeInTheDocument();
  });

  it('空の金額で送信ボタンが無効化されること', async () => {
    render(<DepositForm {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: '入金' });
    expect(submitButton).toBeDisabled();
  });

  it('最小入金額未満の場合にエラーが表示されること', async () => {
    render(<DepositForm {...defaultProps} />);
    const input = screen.getByLabelText(/金額 \(USD\)/);

    fireEvent.change(input, { target: { value: '5' } });

    expect(screen.getByText(/最小入金額は \$10 です/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /入金/ })).toBeDisabled();
  });

  it('最大入金額を超える場合にエラーが表示されること', async () => {
    render(<DepositForm {...defaultProps} />);
    const input = screen.getByLabelText(/金額 \(USD\)/);

    fireEvent.change(input, { target: { value: '1001' } });

    expect(screen.getByText(/最大入金額は 1,000 USD です/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /入金/ })).toBeDisabled();
  });

  it('有効な金額で送信できること', async () => {
    const onSubmit = vi.fn();
    render(<DepositForm {...defaultProps} onSubmit={onSubmit} />);
    const input = screen.getByLabelText(/金額 \(USD\)/);

    fireEvent.change(input, { target: { value: '50' } });

    const submitButton = screen.getByRole('button', { name: /\$50 を入金/ });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(50);
    });
  });

  it('ローディング中にボタンが読み込み中表示になること', () => {
    // isLoading (処理中)
    render(<DepositForm {...defaultProps} isLoading={true} />);
    expect(screen.getByText('処理中...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '処理中...' })).toBeDisabled();

    // limitsLoading (読み込み中)
    render(<DepositForm {...defaultProps} limitsLoading={true} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('為替レートが表示されること', () => {
    const limits = {
      minAmountCrypto: 0.01,
      maxAmountCrypto: 1.0,
      exchangeRate: 150.5,
      enabled: true,
    };
    render(<DepositForm {...defaultProps} limits={limits} selectedCurrency="ETH" />);

    expect(screen.getByText(/0.01000000 ETH/)).toBeInTheDocument();
    expect(screen.getByText(/1 ETH = \$150.50/)).toBeInTheDocument();
  });

  it('送信処理が失敗した場合にエラーメッセージが表示されること', async () => {
    const errorSubmit = vi.fn().mockRejectedValue(new Error('ネットワークエラー'));
    render(<DepositForm {...defaultProps} onSubmit={errorSubmit} />);

    const input = screen.getByLabelText(/金額 \(USD\)/);
    fireEvent.change(input, { target: { value: '50' } });

    fireEvent.click(screen.getByRole('button', { name: /\$50 を入金/ }));

    await waitFor(() => {
      expect(screen.getByText('ネットワークエラー')).toBeInTheDocument();
    });
  });

  it('制限額取得エラーが表示されること', () => {
    render(<DepositForm {...defaultProps} limitsError="取得できませんでした" />);
    expect(screen.getByText('制限額の取得に失敗しました: 取得できませんでした')).toBeInTheDocument();
  });

  it('最小/最大額が未定義の場合、デフォルトのプレースホルダーが表示されること', () => {
    render(<DepositForm {...defaultProps} minAmount={undefined} maxAmount={undefined} />);
    const input = screen.getByLabelText(/金額 \(USD\)/);
    expect(input).toHaveAttribute('placeholder', '金額を入力してください');
  });
});
