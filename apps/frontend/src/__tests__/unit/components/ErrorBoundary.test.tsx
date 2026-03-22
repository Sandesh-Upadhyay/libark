import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ErrorBoundary } from '@/components/templates/ErrorBoundary';

function Boom() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('エラー時にフォールバックUIを表示する', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </MemoryRouter>
    );
    expect(screen.getByText('予期せぬエラーが発生しました')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ホームへ戻る' })).toBeInTheDocument();
  });
});
