import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { AvailableP2POffersDocument } from '@libark/graphql-client';
import React from 'react';

import { P2POfferTable } from '../P2POfferTable';

const mockOffers = [
  {
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
      __typename: 'User',
      id: 'seller1',
      username: 'testseller1',
      displayName: 'Test Seller 1',
      profileImageId: null,
    },
    __typename: 'P2POffer',
  },
  {
    id: '2',
    sellerId: 'seller2',
    paymentMethod: 'PAYPAL',
    minAmountUsd: '10',
    maxAmountUsd: '1000',
    fiatCurrency: 'USD',
    exchangeRateMargin: '1.0',
    isActive: true,
    instructions: null,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seller: {
      __typename: 'User',
      id: 'seller2',
      username: 'testseller2',
      displayName: 'Test Seller 2',
      profileImageId: null,
    },
    __typename: 'P2POffer',
  },
];

const variables = {
  fiatCurrency: 'JPY',
  paymentMethod: undefined,
  amountUsd: undefined,
  first: 10,
  orderBy: {
    field: 'RATE',
    order: 'ASC',
  },
};

const successMock = {
  request: {
    query: AvailableP2POffersDocument,
    variables,
  },
  result: {
    data: {
      availableP2POffers: {
        __typename: 'P2POfferConnection',
        totalCount: 2,
        pageInfo: {
          __typename: 'PageInfo',
          hasNextPage: false,
          endCursor: 'cursor2',
        },
        edges: mockOffers.map(offer => ({
          __typename: 'P2POfferEdge',
          cursor: `cursor${offer.id}`,
          node: offer,
        })),
      },
    },
  },
};

const emptyMock = {
  request: {
    query: AvailableP2POffersDocument,
    variables,
  },
  result: {
    data: {
      availableP2POffers: {
        __typename: 'P2POfferConnection',
        totalCount: 0,
        pageInfo: {
          __typename: 'PageInfo',
          hasNextPage: false,
          endCursor: null,
        },
        edges: [],
      },
    },
  },
};

const errorMock = {
  request: {
    query: AvailableP2POffersDocument,
    variables,
  },
  error: new Error('Network error'),
};

describe('P2POfferTable', () => {
  it('読み込み中状態が表示されること', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={['/p2p?currency=JPY']}>
          <P2POfferTable />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('オファーデータが正常にレンダリングされること', async () => {
    render(
      <MockedProvider mocks={[successMock]} addTypename={true}>
        <MemoryRouter initialEntries={['/p2p?currency=JPY']}>
          <P2POfferTable />
        </MemoryRouter>
      </MockedProvider>
    );

    await waitFor(() => {
      // デスクトップテーブル表示とモバイル表示の両方があるため、AllByText を使用
      expect(screen.getAllByText(/@testseller1/)[0]).toBeInTheDocument();
    });

    expect(screen.getByText('銀行振込')).toBeInTheDocument();
  });

  it('データが空の場合、メッセージが表示されること', async () => {
    render(
      <MockedProvider mocks={[emptyMock]} addTypename={true}>
        <MemoryRouter initialEntries={['/p2p?currency=JPY']}>
          <P2POfferTable />
        </MemoryRouter>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getAllByText('利用可能なオファーが見つかりませんでした')[0]
      ).toBeInTheDocument();
    });
  });

  it('エラー時、エラーメッセージが表示されること', async () => {
    render(
      <MockedProvider mocks={[errorMock]} addTypename={true}>
        <MemoryRouter initialEntries={['/p2p?currency=JPY']}>
          <P2POfferTable />
        </MemoryRouter>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText('データの読み込みに失敗しました。再試行してください。')
      ).toBeInTheDocument();
    });
  });

  it('購入ボタン押下時に onBuyClick が呼ばれること', async () => {
    const onBuyClick = vi.fn();
    render(
      <MockedProvider mocks={[successMock]} addTypename={true}>
        <MemoryRouter initialEntries={['/p2p?currency=JPY']}>
          <P2POfferTable onBuyClick={onBuyClick} />
        </MemoryRouter>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('購入する')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('購入する')[0]);
    expect(onBuyClick).toHaveBeenCalled();
  });
});
