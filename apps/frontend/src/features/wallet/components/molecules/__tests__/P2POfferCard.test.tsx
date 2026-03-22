import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { P2POfferInfoFragment } from '@libark/graphql-client';

import { P2POfferCard } from '../P2POfferCard';

const mockOffer: P2POfferInfoFragment = {
  id: '1',
  sellerId: 'seller1',
  paymentMethod: 'BANK_TRANSFER',
  minAmountUsd: '50',
  maxAmountUsd: '500',
  fiatCurrency: 'JPY',
  exchangeRateMargin: '0.5',
  isActive: true,
  instructions: null,
  priority: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  seller: {
    id: 'seller1',
    username: 'testseller',
    profileImageId: null,
  },
};

describe('P2POfferCard', () => {
  it('should render offer details', () => {
    render(
      <P2POfferCard offer={mockOffer} requestedAmount={100} fiatCurrency='JPY' onSelect={vi.fn()} />
    );

    expect(screen.getByText('@testseller')).toBeInTheDocument();
    expect(screen.getByText(/150.75 JPY\/USD/)).toBeInTheDocument();
  });

  it('should call onSelect when button is clicked', () => {
    const onSelect = vi.fn();
    render(
      <P2POfferCard
        offer={mockOffer}
        requestedAmount={100}
        fiatCurrency='JPY'
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('このオファーを選択'));
    expect(onSelect).toHaveBeenCalledWith(mockOffer);
  });
});
