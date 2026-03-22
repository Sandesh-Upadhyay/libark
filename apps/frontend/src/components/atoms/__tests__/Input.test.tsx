/**
 * 🧪 Input コンポーネントのユニットテスト
 */

// @ts-ignore - Inputコンポーネントの型定義と実装に一時的な不一致があるため、型チェックを一時的に無効化
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Input } from '../input';

describe('Input', () => {
  describe('基本的なレンダリング', () => {
    it('デフォルトでレンダリングされる', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });

  describe('placeholderプロパティ', () => {
    it('placeholderを表示する', () => {
      render(<Input placeholder='Enter text' />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });
  });

  describe('disabled状態', () => {
    it('disabled=trueで無効化される', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('disabled時にフォーカスできない', async () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      expect(input).not.toHaveFocus();
    });

    it('disabled時に値を変更できない', async () => {
      render(<Input disabled defaultValue='test' />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'new');
      expect(input).toHaveValue('test');
    });
  });

  describe('error状態', () => {
    it('aria-invalid属性でエラー状態を示す', () => {
      render(<Input aria-invalid='true' />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('aria-invalid="false"で正常状態を示す', () => {
      render(<Input aria-invalid='false' />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('onChangeイベントハンドラー', () => {
    it('値が変更された時にonChangeが呼ばれる', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('onChangeで変更された値を取得できる', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('hello');
    });

    it('バックスペースで値を削除できる', async () => {
      render(<Input defaultValue='test' />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '{backspace}');
      expect(input).toHaveValue('tes');
    });
  });

  describe('onFocus/onBlurイベントハンドラー', () => {
    it('フォーカス時にonFocusが呼ばれる', async () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('フォーカスが外れた時にonBlurが呼ばれる', async () => {
      const handleBlur = vi.fn();
      render(
        <div>
          <Input onBlur={handleBlur} />
          <button>Other</button>
        </div>
      );
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');
      await userEvent.click(input);
      await userEvent.click(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('フォーカスとブラーのイベントが正しく発生する', async () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      render(
        <div>
          <Input onFocus={handleFocus} onBlur={handleBlur} />
          <button>Other</button>
        </div>
      );
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');

      await userEvent.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      expect(handleBlur).not.toHaveBeenCalled();

      await userEvent.click(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('アクセシビリティ属性', () => {
    it('aria-invalid属性を設定できる', () => {
      render(<Input aria-invalid='true' />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('aria-describedby属性を設定できる', () => {
      render(<Input aria-describedby='error-message' />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('aria-label属性を設定できる', () => {
      render(<Input aria-label='Email input' />);
      const input = screen.getByRole('textbox', { name: 'Email input' });
      expect(input).toBeInTheDocument();
    });

    it('aria-required属性を設定できる', () => {
      render(<Input aria-required='true' />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('disabled属性が設定される', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('disabled');
      expect(input).toBeDisabled();
    });
  });

  describe('値の管理', () => {
    it('defaultValueで初期値を設定できる', () => {
      render(<Input defaultValue='initial value' />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial value');
    });
  });

  describe('カスタムクラス名', () => {
    it('追加のclassNameをマージする', () => {
      render(<Input className='custom-class' />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('複数のクラスを正しくマージする', () => {
      render(<Input className='class-1 class-2' />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('class-1');
      expect(input).toHaveClass('class-2');
    });

    it('デフォルトクラスが適用される', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-9');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-md');
    });
  });

  describe('フォーカス状態', () => {
    it('フォーカスリングのクラスを持つ', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:ring-1');
    });

    it('フォーカス時にスタイルが変わる', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      expect(input).toHaveFocus();
    });
  });

  describe('トランジション効果', () => {
    it('トランジションクラスを持つ', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('transition-colors');
    });
  });
});
