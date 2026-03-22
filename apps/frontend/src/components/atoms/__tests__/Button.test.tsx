/**
 * 🧪 Button コンポーネントのユニットテスト
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '../button';

describe('Button', () => {
  describe('基本的なレンダリング', () => {
    it('デフォルトでレンダリングされる', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('子要素を正しくレンダリングする', () => {
      render(<Button>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('variantプロパティ', () => {
    it('defaultバリアントを適用する', () => {
      render(<Button variant='default'>Default</Button>);
      const button = screen.getByRole('button', { name: 'Default' });
      expect(button).toHaveClass('bg-primary');
    });

    it('secondaryバリアントを適用する', () => {
      render(<Button variant='secondary'>Secondary</Button>);
      const button = screen.getByRole('button', { name: 'Secondary' });
      expect(button).toHaveClass('bg-secondary');
    });

    it('ghostバリアントを適用する', () => {
      render(<Button variant='ghost'>Ghost</Button>);
      const button = screen.getByRole('button', { name: 'Ghost' });
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('destructiveバリアントを適用する（dangerの代わり）', () => {
      render(<Button variant='destructive'>Delete</Button>);
      const button = screen.getByRole('button', { name: 'Delete' });
      expect(button).toHaveClass('bg-destructive');
    });

    it('outlineバリアントを適用する', () => {
      render(<Button variant='outline'>Outline</Button>);
      const button = screen.getByRole('button', { name: 'Outline' });
      expect(button).toHaveClass('border');
    });

    it('linkバリアントを適用する', () => {
      render(<Button variant='link'>Link</Button>);
      const button = screen.getByRole('button', { name: 'Link' });
      expect(button).toHaveClass('underline-offset-4');
      expect(button).toHaveClass('hover:underline');
    });
  });

  describe('sizeプロパティ', () => {
    it('smサイズを適用する', () => {
      render(<Button size='sm'>Small</Button>);
      const button = screen.getByRole('button', { name: 'Small' });
      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('px-3');
    });

    it('mdサイズを適用する', () => {
      render(<Button size='md'>Medium</Button>);
      const button = screen.getByRole('button', { name: 'Medium' });
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-4');
    });

    it('lgサイズを適用する', () => {
      render(<Button size='lg'>Large</Button>);
      const button = screen.getByRole('button', { name: 'Large' });
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-6');
    });

    it('iconサイズを適用する', () => {
      render(<Button size='icon'>Icon</Button>);
      const button = screen.getByRole('button', { name: 'Icon' });
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('w-9');
    });

    it('icon-smサイズを適用する', () => {
      render(<Button size='icon-sm'>Icon Small</Button>);
      const button = screen.getByRole('button', { name: 'Icon Small' });
      expect(button).toHaveClass('h-7');
      expect(button).toHaveClass('w-7');
    });
  });

  describe('disabled状態', () => {
    it('disabled=trueで無効化される', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: 'Disabled' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('disabled時にonClickが呼ばれない', async () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Click me
        </Button>
      );
      await userEvent.click(screen.getByRole('button', { name: 'Click me' }));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('loading状態', () => {
    it('loading=trueでローディングアイコンが表示される', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button', { name: 'Loading' });
      expect(button).toBeDisabled();
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('loading時にonClickが呼ばれない', async () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Click me
        </Button>
      );
      await userEvent.click(screen.getByRole('button', { name: 'Click me' }));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('loadingとdisabledの両方がtrueの場合でもローディングが優先される', () => {
      render(
        <Button loading disabled>
          Loading and Disabled
        </Button>
      );
      const button = screen.getByRole('button', { name: 'Loading and Disabled' });
      expect(button).toBeDisabled();
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('onClickイベントハンドラー', () => {
    it('クリック時にonClickが呼ばれる', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      await userEvent.click(screen.getByRole('button', { name: 'Click me' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('複数回クリックでonClickが複数回呼ばれる', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('アイコン付きボタン', () => {
    it('アイコンを含むボタンをレンダリングする', () => {
      const Icon = () => <span data-testid='icon'>★</span>;
      render(
        <Button>
          <Icon />
          With Icon
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('アイコンのみのボタンをレンダリングする', () => {
      const Icon = () => <span data-testid='icon'>★</span>;
      render(
        <Button size='icon'>
          <Icon />
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('フル幅ボタン', () => {
    it('w-fullクラスで全幅表示になる', () => {
      render(<Button className='w-full'>Full Width</Button>);
      const button = screen.getByRole('button', { name: 'Full Width' });
      expect(button).toHaveClass('w-full');
    });
  });

  describe('アクセシビリティ属性', () => {
    it('aria-labelを設定できる', () => {
      render(<Button aria-label='Close button'>✕</Button>);
      const button = screen.getByRole('button', { name: 'Close button' });
      expect(button).toHaveAttribute('aria-label', 'Close button');
    });

    it('roleを設定できる', () => {
      render(<Button role='submit'>Submit</Button>);
      const button = screen.getByRole('submit');
      expect(button).toBeInTheDocument();
    });

    it('disabled属性が設定される', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: 'Disabled' });
      expect(button).toHaveAttribute('disabled');
      expect(button).toBeDisabled();
    });

    it('フォーカス可能である', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button', { name: 'Focusable' });
      // Buttonコンポーネントはtype属性を明示的に設定していないため、
      // デフォルトのbutton要素として機能することを確認する
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });
  });

  describe('カスタムクラス名', () => {
    it('追加のclassNameをマージする', () => {
      render(<Button className='custom-class'>Custom</Button>);
      const button = screen.getByRole('button', { name: 'Custom' });
      expect(button).toHaveClass('custom-class');
    });

    it('複数のクラスを正しくマージする', () => {
      render(
        <Button className='class-1 class-2' variant='secondary'>
          Multiple Classes
        </Button>
      );
      const button = screen.getByRole('button', { name: 'Multiple Classes' });
      expect(button).toHaveClass('class-1');
      expect(button).toHaveClass('class-2');
      expect(button).toHaveClass('bg-secondary');
    });
  });

  describe('asChildプロパティ', () => {
    it('asChild=trueで子要素としてレンダリングする', () => {
      render(
        <Button asChild>
          <a href='/test'>Link Button</a>
        </Button>
      );
      const link = screen.getByRole('link', { name: 'Link Button' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });

    it('asChild=trueでローディング状態が表示されない', () => {
      render(
        <Button asChild loading>
          <a href='/test'>Link Button</a>
        </Button>
      );
      const link = screen.getByRole('link', { name: 'Link Button' });
      expect(link).toBeInTheDocument();
      expect(link.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  describe('フォーカス状態', () => {
    it('フォーカスリングのクラスを持つ', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button', { name: 'Focus Test' });
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('トランジション効果', () => {
    it('トランジションクラスを持つ', () => {
      render(<Button>Transition Test</Button>);
      const button = screen.getByRole('button', { name: 'Transition Test' });
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
    });
  });
});
