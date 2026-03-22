import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAuth } from '@libark/graphql-client';
import React from 'react';

import { MultiWalletBalanceCard } from '../MultiWalletBalanceCard';

// Mock useAuth
vi.mock('@libark/graphql-client', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe('MultiWalletBalanceCard', () => {
  it('USERロールの場合、ウォレット残高のみが表示されること', () => {
    (useAuth as any).mockReturnValue({
      user: { role: 'USER' },
    });

    render(
      <MultiWalletBalanceCard
        walletBalance={1000}
        salesBalance={500}
        p2pBalance={200}
        currency="USD"
      />
    );

    // WalletBalance は数値と通貨を分割して表示するため、正規表現で個別にチェック
    expect(screen.getByText(/1,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/USD/)).toBeInTheDocument();
    expect(screen.getByText('ウォレット残高')).toBeInTheDocument();

    // 他の残高（タブ）が表示されないことを確認
    expect(screen.queryByText('売上')).not.toBeInTheDocument();
    expect(screen.queryByText('P2P')).not.toBeInTheDocument();
  });

  it('ADMINロールの場合、すべての残高タブが表示されること', () => {
    (useAuth as any).mockReturnValue({
      user: { role: 'ADMIN' },
    });

    render(
      <MultiWalletBalanceCard
        walletBalance={1000}
        salesBalance={500}
        p2pBalance={200}
        currency="USD"
      />
    );

    expect(screen.getByText(/1,000\.00/)).toBeInTheDocument();

    // タブが表示されていることを確認
    expect(screen.getByText('売上')).toBeInTheDocument();
    expect(screen.getByText('P2P')).toBeInTheDocument();

    // 売上タブに切り替え
    fireEvent.click(screen.getByText('売上'));
    expect(screen.getByText(/500\.00/)).toBeInTheDocument();
    expect(screen.getByText('売上残高')).toBeInTheDocument();

    // P2Pタブに切り替え
    fireEvent.click(screen.getByText('P2P'));
    expect(screen.getByText(/200\.00/)).toBeInTheDocument();
    expect(screen.getByText('P2P残高')).toBeInTheDocument();
  });

  it('アクションボタンがクリックされたときにコールバックが呼ばれること', () => {
    (useAuth as any).mockReturnValue({
      user: { role: 'USER' },
    });

    const onDeposit = vi.fn();
    const onWithdraw = vi.fn();
    const onTransfer = vi.fn();

    render(
      <MultiWalletBalanceCard
        walletBalance={1000}
        salesBalance={500}
        p2pBalance={200}
        onDeposit={onDeposit}
        onWithdraw={onWithdraw}
        onTransfer={onTransfer}
      />
    );

    fireEvent.click(screen.getByText('入金'));
    expect(onDeposit).toHaveBeenCalledWith('wallet');

    fireEvent.click(screen.getByText('出金'));
    expect(onWithdraw).toHaveBeenCalledWith('wallet');

    fireEvent.click(screen.getByText('残高移動'));
    expect(onTransfer).toHaveBeenCalled();
  });
});
