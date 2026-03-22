import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { P2PTradeStatus } from '@libark/graphql-client';

import { P2PStatusBadge } from '../P2PStatusBadge';

describe('P2PStatusBadge', () => {
  it('should render PENDING status', () => {
    render(<P2PStatusBadge status={'PENDING' as P2PTradeStatus} />);
    expect(screen.getByText('待機中')).toBeInTheDocument();
  });

  it('should render COMPLETED status', () => {
    render(<P2PStatusBadge status={'COMPLETED' as P2PTradeStatus} />);
    expect(screen.getByText('完了')).toBeInTheDocument();
  });

  it('should render CANCELLED status', () => {
    render(<P2PStatusBadge status={'CANCELLED' as P2PTradeStatus} />);
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });
});
