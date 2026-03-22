/**
 * 🧪 NotificationIcon コンポーネント テスト
 * @vitest-environment jsdom
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { NotificationIcon } from '../NotificationIcon';

describe('NotificationIcon', () => {
  afterEach(() => {
    cleanup();
  });

  describe('通知アイコンの表示', () => {
    it('通知アイコンが正しく表示されること', () => {
      render(<NotificationIcon />);

      const icon = screen.getByLabelText('通知');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('role', 'img');
    });

    it('未読通知がある場合、バッジが表示されること', () => {
      render(<NotificationIcon hasUnread={true} />);

      const badge = screen.getByLabelText('未読通知あり');
      expect(badge).toBeInTheDocument();
    });

    it('未読通知がない場合、バッジが表示されないこと', () => {
      render(<NotificationIcon hasUnread={false} />);

      const badge = screen.queryByLabelText('未読通知あり');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('カスタムクラス名', () => {
    it('カスタムクラス名が適用されること', () => {
      const { container } = render(<NotificationIcon className='custom-class' />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('複数のクラス名が適用されること', () => {
      const { container } = render(<NotificationIcon className='class1 class2 class3' />);

      expect(container.firstChild).toHaveClass('class1', 'class2', 'class3');
    });
  });

  describe('アクセシビリティ', () => {
    it('デフォルトのARIAラベルが設定されること', () => {
      render(<NotificationIcon />);

      const icon = screen.getByLabelText('通知');
      expect(icon).toBeInTheDocument();
    });

    it('カスタムARIAラベルが設定されること', () => {
      render(<NotificationIcon aria-label='通知一覧' />);

      const icon = screen.getByLabelText('通知一覧');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('バッジのスタイル', () => {
    it('バッジが正しい位置に表示されること', () => {
      const { container } = render(<NotificationIcon hasUnread={true} />);

      const badge = container.querySelector('.absolute.-top-1.-right-1');
      expect(badge).toBeInTheDocument();
    });

    it('バッジが正しいサイズであること', () => {
      const { container } = render(<NotificationIcon hasUnread={true} />);

      const badge = container.querySelector('.h-2.w-2');
      expect(badge).toBeInTheDocument();
    });

    it('バッジが丸い形状であること', () => {
      const { container } = render(<NotificationIcon hasUnread={true} />);

      const badge = container.querySelector('.rounded-full');
      expect(badge).toBeInTheDocument();
    });
  });
});
