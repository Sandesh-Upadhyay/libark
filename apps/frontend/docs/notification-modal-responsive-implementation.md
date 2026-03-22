# 通知モーダルコンポーネント レスポンシブ対応実装

## 概要

LIBARKプロジェクトの通知モーダルコンポーネント（`NotificationDropdown.tsx`）にモバイルとデスクトップの両方に最適化されたレスポンシブデザインを実装しました。

## 実装内容

### 1. DropdownMenuContentのレスポンシブ対応

**変更前:**

```tsx
<DropdownMenuContent
  align='end'
  sideOffset={4}
  role="menu"
  aria-label="通知メニュー"
>
```

**変更後:**

```tsx
<DropdownMenuContent
  align='end'
  sideOffset={4}
  role="menu"
  aria-label="通知メニュー"
  className="w-[calc(100vw-2rem)] sm:w-auto min-w-[20rem] max-w-sm sm:max-w-md max-h-[60vh] sm:max-h-[50vh]"
>
```

**適用されるスタイル:**

- **モバイル（768px以下）:** `w-[calc(100vw-2rem)]` - 画面幅から余白を引いた幅
- **デスクトップ（769px以上）:** `sm:w-auto` - 自動幅調整
- **最小幅:** `min-w-[20rem]` - 320px
- **最大幅:** `max-w-sm` (384px) / `sm:max-w-md` (448px)
- **最大高さ:** `max-h-[60vh]` / `sm:max-h-[50vh]` - ビューポート高さに応じた調整

### 2. NotificationItemの最適化

**変更前:**

```tsx
<DropdownMenuItem
  onClick={handleItemClick}
  role="button"
  tabIndex={0}
  aria-label={...}
>
```

**変更後:**

```tsx
<DropdownMenuItem
  onClick={handleItemClick}
  role="button"
  tabIndex={0}
  aria-label={...}
  className="py-3 px-4 sm:py-2.5 sm:px-3 min-h-[44px] sm:min-h-auto"
>
```

**適用されるスタイル:**

- **モバイル:** `py-3 px-4` - タッチ操作に適した大きなパディング
- **デスクトップ:** `sm:py-2.5 sm:px-3` - 標準的なパディング
- **タッチターゲット:** `min-h-[44px]` - アクセシビリティガイドライン準拠

### 3. アイコンエリアの調整

**変更前:**

```tsx
<div className='p-1.5 rounded-full flex-shrink-0 bg-accent'>
```

**変更後:**

```tsx
<div className='p-2 sm:p-1.5 rounded-full flex-shrink-0 bg-accent'>
```

### 4. テキストサイズとスペーシングの最適化

**ユーザー名表示:**

```tsx
<Text size='sm' weight='medium' className='text-foreground truncate text-base sm:text-sm'>
```

**通知内容:**

```tsx
<Text size='sm' variant='muted' className='mt-1 sm:mt-0.5 line-clamp-2 text-base sm:text-sm leading-relaxed sm:leading-normal'>
```

**タイムスタンプ:**

```tsx
<Text size='xs' variant='muted' className='mt-1.5 sm:mt-1 text-sm sm:text-xs'>
```

### 5. 未読インジケーターの調整

**変更前:**

```tsx
<div className='w-2 h-2 bg-primary rounded-full' aria-label='未読' />
```

**変更後:**

```tsx
<div className='w-2.5 h-2.5 sm:w-2 sm:h-2 bg-primary rounded-full' aria-label='未読' />
```

### 6. ヘッダーとフッターの最適化

**ヘッダー:**

```tsx
<div className='px-4 py-3 sm:px-3 sm:py-2 border-b border-border'>
  <Text size='sm' weight='medium' className='text-foreground ml-2 text-base sm:text-sm'>
    通知
  </Text>
  <button className='text-sm sm:text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] sm:min-h-auto flex items-center'>
    全て既読
  </button>
</div>
```

**フッター:**

```tsx
<div className='px-4 py-3 sm:px-3 sm:py-2 border-t border-border'>
  <button className='text-sm sm:text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center min-h-[44px] sm:min-h-auto flex items-center justify-center'>
    すべて表示
  </button>
</div>
```

## レスポンシブブレークポイント

- **モバイル:** `< 640px` (sm未満)
- **デスクトップ:** `≥ 640px` (sm以上)

## アクセシビリティ対応

1. **タッチターゲットサイズ:** モバイルで最小44pxを確保
2. **ARIA属性:** 既存のアクセシビリティ属性を維持
3. **キーボードナビゲーション:** 既存の機能を保持
4. **スクリーンリーダー対応:** 適切なラベルとロールを設定

## テスト実装

`apps/frontend/components/molecules/__tests__/NotificationDropdown.test.tsx` にレスポンシブ対応のテストを実装:

- 基本機能テスト
- レスポンシブ対応テスト
- アクセシビリティテスト
- 機能テスト

## 技術的制約の遵守

✅ 既存のTailwind CSSクラスを活用  
✅ Radix UIコンポーネントの構造を維持  
✅ 既存の機能（未読表示、外部リンク等）を保持  
✅ TypeScript型定義を変更せず

## 成果物

1. **修正されたコンポーネントファイル:** `NotificationDropdown.tsx`
2. **レスポンシブ対応の確認:** モバイル・デスクトップ両対応
3. **テストコードの実装:** 包括的なテストスイート
4. **ドキュメント:** この実装ドキュメント

## 今後の改善提案

1. **アニメーション効果の最適化:** モバイルでのパフォーマンス向上
2. **ダークモード対応:** カラーテーマの最適化
3. **国際化対応:** 多言語でのレイアウト調整
4. **パフォーマンス監視:** 大量通知時の最適化
