import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { P2PAmountDisplay } from '../P2PAmountDisplay';

describe('P2PAmountDisplay', () => {
  it('should display USD and JPY amounts', () => {
    render(
      <P2PAmountDisplay amountUsd={100} fiatAmount={15000} fiatCurrency='JPY' exchangeRate={150} />
    );

    // 入金額（USDフォーマット）
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    // 支払額（JPYフォーマット - Intl.NumberFormat で全角円記号と小数点付き）
    expect(screen.getByText('￥15,000.00')).toBeInTheDocument();
    // レート表示
    expect(screen.getByText(/1 USD = 150\.00 JPY/)).toBeInTheDocument();
  });

  it('should display USD and USD amounts', () => {
    render(
      <P2PAmountDisplay amountUsd={100} fiatAmount={100} fiatCurrency='USD' exchangeRate={1} />
    );

    // 両方ともUSDフォーマット
    const usdAmounts = screen.getAllByText('$100.00');
    expect(usdAmounts.length).toBe(2);
  });
});
