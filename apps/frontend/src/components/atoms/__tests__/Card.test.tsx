/**
 * 🧪 Card コンポーネントのユニットテスト
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
  describe('基本的なレンダリング', () => {
    it('デフォルトでレンダリングされる', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('デフォルトのクラスが適用される', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('text-card-foreground');
      expect(card).toHaveClass('shadow');
    });
  });

  describe('childrenのレンダリング', () => {
    it('単一の子要素をレンダリングする', () => {
      render(<Card>Single Child</Card>);
      expect(screen.getByText('Single Child')).toBeInTheDocument();
    });

    it('複数の子要素をレンダリングする', () => {
      render(
        <Card>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </Card>
      );
      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
      expect(screen.getByText('Third Child')).toBeInTheDocument();
    });

    it('ネストされた構造をレンダリングする', () => {
      render(
        <Card>
          <div>
            <span>Nested Content</span>
          </div>
        </Card>
      );
      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });
  });

  describe('onClickイベントハンドラー', () => {
    it('クリック時にonClickが呼ばれる', async () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = container.firstChild as HTMLElement;
      if (card) {
        await userEvent.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });

    it('複数回クリックでonClickが複数回呼ばれる', async () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Multi Click</Card>);
      const card = container.firstChild as HTMLElement;
      if (card) {
        await userEvent.click(card);
        await userEvent.click(card);
        await userEvent.click(card);
        expect(handleClick).toHaveBeenCalledTimes(3);
      }
    });
  });

  describe('hover状態', () => {
    it('hoverクラスを追加できる', () => {
      const { container } = render(<Card className='hover:shadow-lg'>Hover Card</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('cursor-pointerでクリック可能であることを示す', () => {
      const { container } = render(<Card className='cursor-pointer'>Clickable</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('カスタムクラス名', () => {
    it('追加のclassNameをマージする', () => {
      const { container } = render(<Card className='custom-class'>Custom</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('複数のクラスを正しくマージする', () => {
      const { container } = render(<Card className='class-1 class-2'>Multiple Classes</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('class-1');
      expect(card).toHaveClass('class-2');
      expect(card).toHaveClass('rounded-lg');
    });

    it('デフォルトクラスを上書きできる', () => {
      const { container } = render(<Card className='rounded-none'>Override</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-none');
    });
  });

  describe('アクセシビリティ', () => {
    it('role属性を設定できる', () => {
      const { container } = render(<Card role='article'>Article Card</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('role', 'article');
    });

    it('aria-labelを設定できる', () => {
      const { container } = render(<Card aria-label='Card description'>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('aria-label', 'Card description');
    });

    it('tabIndexでフォーカス可能にできる', () => {
      const { container } = render(<Card tabIndex={0}>Focusable Card</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('スタイルのバリエーション', () => {
    it('border-noneで枠線を消す', () => {
      const { container } = render(<Card className='border-none'>No Border</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-none');
    });

    it('shadow-noneで影を消す', () => {
      const { container } = render(<Card className='shadow-none'>No Shadow</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-none');
    });

    it('bg-transparentで背景を透明にする', () => {
      const { container } = render(<Card className='bg-transparent'>Transparent</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-transparent');
    });
  });
});

describe('CardHeader', () => {
  it('デフォルトでレンダリングされる', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('デフォルトのクラスが適用される', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('flex-col');
    expect(header).toHaveClass('space-y-1.5');
    expect(header).toHaveClass('p-6');
  });

  it('カスタムクラスをマージする', () => {
    const { container } = render(<CardHeader className='custom-header'>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('custom-header');
  });
});

describe('CardTitle', () => {
  it('デフォルトでレンダリングされる', () => {
    render(<CardTitle>Card Title</CardTitle>);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('デフォルトのクラスが適用される', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    const title = container.firstChild as HTMLElement;
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveClass('leading-none');
    expect(title).toHaveClass('tracking-tight');
  });

  it('カスタムクラスをマージする', () => {
    const { container } = render(<CardTitle className='text-xl'>Title</CardTitle>);
    const title = container.firstChild as HTMLElement;
    expect(title).toHaveClass('text-xl');
  });
});

describe('CardDescription', () => {
  it('デフォルトでレンダリングされる', () => {
    render(<CardDescription>Description Text</CardDescription>);
    expect(screen.getByText('Description Text')).toBeInTheDocument();
  });

  it('デフォルトのクラスが適用される', () => {
    const { container } = render(<CardDescription>Description</CardDescription>);
    const description = container.firstChild as HTMLElement;
    expect(description).toHaveClass('text-sm');
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('カスタムクラスをマージする', () => {
    const { container } = render(
      <CardDescription className='text-gray-500'>Description</CardDescription>
    );
    const description = container.firstChild as HTMLElement;
    expect(description).toHaveClass('text-gray-500');
  });
});

describe('CardContent', () => {
  it('デフォルトでレンダリングされる', () => {
    render(<CardContent>Content Text</CardContent>);
    expect(screen.getByText('Content Text')).toBeInTheDocument();
  });

  it('デフォルトのクラスが適用される', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass('p-6');
  });

  it('カスタムクラスをマージする', () => {
    const { container } = render(<CardContent className='custom-content'>Content</CardContent>);
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass('custom-content');
  });
});

describe('CardFooter', () => {
  it('デフォルトでレンダリングされる', () => {
    render(<CardFooter>Footer Content</CardFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('デフォルトのクラスが適用される', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(footer).toHaveClass('p-6');
  });

  it('カスタムクラスをマージする', () => {
    const { container } = render(<CardFooter className='justify-between'>Footer</CardFooter>);
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass('justify-between');
  });
});

describe('Cardコンポーネントの統合', () => {
  it('すべてのサブコンポーネントを組み合わせてレンダリングする', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('入れ子構造を正しくレンダリングする', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Outer Card</CardTitle>
        </CardHeader>
        <CardContent>
          <Card>
            <CardContent>Inner Card Content</CardContent>
          </Card>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Outer Card')).toBeInTheDocument();
    expect(screen.getByText('Inner Card Content')).toBeInTheDocument();
  });

  it('複数のカードをレンダリングする', () => {
    render(
      <div>
        <Card>
          <CardContent>Card 1</CardContent>
        </Card>
        <Card>
          <CardContent>Card 2</CardContent>
        </Card>
        <Card>
          <CardContent>Card 3</CardContent>
        </Card>
      </div>
    );

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByText('Card 3')).toBeInTheDocument();
  });
});

describe('Cardのデータ属性', () => {
  it('data-testid属性を設定できる', () => {
    render(<Card data-testid='test-card'>Content</Card>);
    expect(screen.getByTestId('test-card')).toBeInTheDocument();
  });

  it('カスタムデータ属性を設定できる', () => {
    const { container } = render(
      <Card data-id='123' data-category='test'>
        Content
      </Card>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute('data-id', '123');
    expect(card).toHaveAttribute('data-category', 'test');
  });
});
