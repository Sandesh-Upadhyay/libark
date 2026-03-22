/**
 * 🧪 複数アバター表示コンポーネントのテスト
 * @vitest-environment jsdom
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { MultipleAvatars, type Actor } from '../MultipleAvatars';

const createMockActor = (
  id: string,
  username: string,
  displayName?: string,
  profileImageUrl?: string
): Actor => ({
  id,
  username,
  displayName,
  profileImageUrl,
});

describe('MultipleAvatars', () => {
  afterEach(() => {
    cleanup();
  });

  it('単一のアバターを表示する', () => {
    const actors = [createMockActor('1', 'user1', 'ユーザー1')];

    render(<MultipleAvatars actors={actors} />);

    const avatar = screen.getByTitle('ユーザー1');
    expect(avatar).toBeTruthy();
  });

  it('複数のアバターを重複表示する', () => {
    const actors = [
      createMockActor('1', 'user1', 'ユーザー1'),
      createMockActor('2', 'user2', 'ユーザー2'),
      createMockActor('3', 'user3', 'ユーザー3'),
    ];

    render(<MultipleAvatars actors={actors} />);

    expect(screen.getByTitle('ユーザー1')).toBeTruthy();
    expect(screen.getByTitle('ユーザー2')).toBeTruthy();
    expect(screen.getByTitle('ユーザー3')).toBeTruthy();
  });

  it('maxVisibleを超える場合は「+N」を表示する', () => {
    const actors = [
      createMockActor('1', 'user1', 'ユーザー1'),
      createMockActor('2', 'user2', 'ユーザー2'),
      createMockActor('3', 'user3', 'ユーザー3'),
      createMockActor('4', 'user4', 'ユーザー4'),
      createMockActor('5', 'user5', 'ユーザー5'),
    ];

    render(<MultipleAvatars actors={actors} maxVisible={3} />);

    // 最初の3人のアバターが表示される
    expect(screen.getByTitle('ユーザー1')).toBeTruthy();
    expect(screen.getByTitle('ユーザー2')).toBeTruthy();
    expect(screen.getByTitle('ユーザー3')).toBeTruthy();

    // 残りの2人は「+2」として表示される
    expect(screen.getByTitle('他2人')).toBeTruthy();
    expect(screen.getByText('+2')).toBeTruthy();

    // 4人目と5人目のアバターは表示されない
    expect(screen.queryByTitle('ユーザー4')).toBeNull();
    expect(screen.queryByTitle('ユーザー5')).toBeNull();
  });

  it('プロフィール画像がある場合は画像を表示する', () => {
    const actors = [createMockActor('1', 'user1', 'ユーザー1', 'https://example.com/avatar.jpg')];

    render(<MultipleAvatars actors={actors} />);

    const img = screen.getByAltText('ユーザー1');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
  });

  it('プロフィール画像がない場合は頭文字を表示する', () => {
    const actors = [createMockActor('1', 'user1', 'ユーザー1')];

    render(<MultipleAvatars actors={actors} />);

    expect(screen.getByText('ユ')).toBeTruthy();
  });

  it('displayNameがない場合はusernameの頭文字を表示する', () => {
    const actors = [createMockActor('1', 'user1')];

    render(<MultipleAvatars actors={actors} />);

    expect(screen.getByText('U')).toBeTruthy();
  });

  it('アクターが空の場合は何も表示しない', () => {
    const { container } = render(<MultipleAvatars actors={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('サイズプロパティが正しく適用される', () => {
    const actors = [createMockActor('1', 'user1', 'ユーザー1')];

    const { rerender } = render(<MultipleAvatars actors={actors} size='sm' />);
    let avatar = screen.getByTitle('ユーザー1');
    expect(avatar.className).toContain('h-6');
    expect(avatar.className).toContain('w-6');

    rerender(<MultipleAvatars actors={actors} size='md' />);
    avatar = screen.getByTitle('ユーザー1');
    expect(avatar.className).toContain('h-8');
    expect(avatar.className).toContain('w-8');

    rerender(<MultipleAvatars actors={actors} size='lg' />);
    avatar = screen.getByTitle('ユーザー1');
    expect(avatar.className).toContain('h-10');
    expect(avatar.className).toContain('w-10');
  });

  it('カスタムクラス名が適用される', () => {
    const actors = [createMockActor('1', 'user1', 'ユーザー1')];

    const { container } = render(<MultipleAvatars actors={actors} className='custom-class' />);

    expect(container.firstChild?.className).toContain('custom-class');
  });

  it('maxVisibleがアクター数以下の場合は「+N」を表示しない', () => {
    const actors = [
      createMockActor('1', 'user1', 'ユーザー1'),
      createMockActor('2', 'user2', 'ユーザー2'),
    ];

    render(<MultipleAvatars actors={actors} maxVisible={3} />);

    expect(screen.getByTitle('ユーザー1')).toBeTruthy();
    expect(screen.getByTitle('ユーザー2')).toBeTruthy();
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it('maxVisibleがアクター数と同じ場合は「+N」を表示しない', () => {
    const actors = [
      createMockActor('1', 'user1', 'ユーザー1'),
      createMockActor('2', 'user2', 'ユーザー2'),
      createMockActor('3', 'user3', 'ユーザー3'),
    ];

    render(<MultipleAvatars actors={actors} maxVisible={3} />);

    expect(screen.getByTitle('ユーザー1')).toBeTruthy();
    expect(screen.getByTitle('ユーザー2')).toBeTruthy();
    expect(screen.getByTitle('ユーザー3')).toBeTruthy();
    expect(screen.queryByText(/^\+/)).toBeNull();
  });
});
