/**
 * 🎯 プロフィール更新通知フック（統一システム版）
 *
 * 統一通知システム（ContentCompletionProvider）に移行済み
 * このフックはユーティリティ関数のみ提供
 */

interface ProfileUpdateDetail {
  type: 'avatar_upload' | 'avatar_delete' | 'profile_text';
  user?: { id: string; displayName?: string; bio?: string };
  profileImageId?: string;
  mediaId?: string;
}

export const useProfileUpdateNotification = () => {
  // プロフィール更新イベントを発火するユーティリティ関数（SSR対応）
  const emitProfileUpdated = (detail: ProfileUpdateDetail) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profile_updated', { detail }));
    }
  };

  const emitAvatarDeleted = (userId?: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('avatar_deleted', {
          detail: { userId, type: 'avatar_delete' },
        })
      );
    }
  };

  return {
    emitProfileUpdated,
    emitAvatarDeleted,
  };
};
